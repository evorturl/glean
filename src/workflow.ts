import { Glean } from "@gleanwork/api-client";
import type {
  ChatMessage,
  DocumentDefinition,
  SearchResponse,
  SearchResult,
} from "@gleanwork/api-client/models/components";

import type { AskConfig, IngestConfig } from "./config.js";
import { loadFixtureDocuments } from "./fixtures.js";
import type { AskQuestionResult, AskSource, IngestResult } from "./types.js";

function makeClient(apiToken: string, serverURL: string) {
  return new Glean({ apiToken, serverURL });
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function clip(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function toDocumentDefinition(
  doc: Awaited<ReturnType<typeof loadFixtureDocuments>>[number],
  config: IngestConfig,
): DocumentDefinition {
  const now = Math.floor(Date.now() / 1000);

  return {
    datasource: config.datasource,
    id: doc.id,
    objectType: "Document",
    title: doc.title,
    viewURL: doc.viewURL,
    tags: doc.tags,
    summary: {
      mimeType: "text/plain",
      textContent: doc.summary,
    },
    body: {
      mimeType: "text/markdown",
      textContent: doc.body,
    },
    permissions: {
      allowedUsers: [{ email: config.allowedUserEmail }],
      allowAnonymousAccess: false,
      allowAllDatasourceUsersAccess: false,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export async function ingestFixtureCorpus(
  config: IngestConfig,
): Promise<IngestResult> {
  const docs = await loadFixtureDocuments();
  const indexingClient = makeClient(config.indexingApiToken, config.serverURL);

  try {
    for (const doc of docs) {
      await indexingClient.indexing.documents.addOrUpdate({
        document: toDocumentDefinition(doc, config),
      });
    }
  } catch (error) {
    throw new Error(
      `Failed to index documents into datasource "${config.datasource}". Confirm the indexing token has scope for that datasource and try again. Original error: ${formatError(
        error,
      )}`,
    );
  }

  let processingTriggered = false;
  let processingMessage =
    "Submitted documents successfully. If they are not searchable immediately, wait briefly and retry.";

  try {
    await indexingClient.indexing.documents.processAll({
      datasource: config.datasource,
    });
    processingTriggered = true;
    processingMessage =
      "Triggered document processing for the selected datasource.";
  } catch (error) {
    processingMessage = `Documents were uploaded, but processAll failed or is rate-limited: ${formatError(
      error,
    )}`;
  }

  return {
    datasource: config.datasource,
    indexedCount: docs.length,
    documentIds: docs.map((doc) => doc.id),
    processingTriggered,
    processingMessage,
  };
}

function searchResultToSource(result: SearchResult): AskSource {
  const snippet =
    result.snippets
      ?.map((candidate) => candidate.text ?? candidate.snippet ?? "")
      .find((candidate) => compactWhitespace(candidate).length > 0) ??
    "No snippet returned.";

  return {
    id: result.document?.id ?? null,
    title: result.title ?? result.document?.title ?? "Untitled source",
    url: result.url,
    snippet: clip(compactWhitespace(snippet), 320),
    datasource: result.document?.datasource ?? null,
  };
}

async function retrieveSources(
  config: AskConfig,
  question: string,
): Promise<{ sources: AskSource[]; response: SearchResponse }> {
  const searchClient = makeClient(config.searchApiToken, config.serverURL);
  const response = await searchClient.client.search.query({
    query: question,
    pageSize: config.topK,
    maxSnippetSize: 280,
    requestOptions: {
      datasourceFilter: config.datasource,
      facetBucketSize: 10,
      returnLlmContentOverSnippets: true,
      responseHints: ["RESULTS"],
    },
    timeoutMillis: 20000,
  });

  const sources = (response.results ?? []).map(searchResultToSource);

  return { sources, response };
}

function buildGroundedPrompt(question: string, sources: AskSource[]) {
  const context = sources
    .map(
      (source, index) =>
        `Source [${index + 1}]
Title: ${source.title}
URL: ${source.url}
Document ID: ${source.id ?? "unknown"}
Excerpt: ${source.snippet}`,
    )
    .join("\n\n");

  return [
    "You are answering an employee question using only the retrieved internal documents below.",
    "If the context is incomplete, say what is missing instead of inventing policy.",
    "Use concise prose and cite supporting sources inline with [1], [2], etc.",
    "",
    `Question: ${question}`,
    "",
    "Retrieved context:",
    context,
  ].join("\n");
}

function extractAssistantText(messages: ChatMessage[] | undefined) {
  if (!messages) {
    return "";
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (!message) {
      continue;
    }

    const text = compactWhitespace(
      (message.fragments ?? [])
        .map((fragment) => fragment.text ?? "")
        .join(" "),
    );

    if (text.length > 0) {
      return text;
    }
  }

  return "";
}

function buildCitationAppendix(sources: AskSource[]) {
  return sources
    .map(
      (source, index) =>
        `[${index + 1}] ${source.title} (${source.id ?? "no-id"}) - ${source.url}`,
    )
    .join("\n");
}

export async function askQuestion(
  config: AskConfig,
  question: string,
): Promise<AskQuestionResult> {
  const { response, sources } = await retrieveSources(config, question);

  if (sources.length === 0) {
    throw new Error(
      `No relevant documents were found in datasource "${config.datasource}". Run the ingest command first, wait for processing to complete, and confirm the indexing token can write to that datasource.`,
    );
  }

  const chatClient = makeClient(config.clientApiToken, config.serverURL);
  const chatResponse = await chatClient.client.chat.create({
    messages: [
      {
        author: "USER",
        fragments: [{ text: buildGroundedPrompt(question, sources) }],
      },
    ],
    timeoutMillis: 20000,
  });

  const assistantText = extractAssistantText(chatResponse.messages);

  if (!assistantText) {
    throw new Error(
      "Glean Chat returned an empty response. Verify the chat token and try again.",
    );
  }

  const answer = config.includeCitations
    ? `${assistantText}\n\nSources\n${buildCitationAppendix(sources)}`
    : assistantText;

  return {
    question,
    datasource: config.datasource,
    answer,
    sources,
    searchRequestId: response.requestID ?? null,
  };
}
