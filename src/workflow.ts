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

export const SEARCH_TIMEOUT_MILLIS = 40_000;
export const CHAT_TIMEOUT_MILLIS = 40_000;
export const INGEST_MAX_ATTEMPTS = 2;

export type WorkflowProgressEvent =
  | {
      kind: "message";
      message: string;
    }
  | {
      kind: "timed-start";
      display?: "bar" | "message";
      message: string;
      timeoutMillis: number;
    }
  | {
      kind: "timed-end";
      message: string;
    };

type WorkflowProgressHandler = (event: WorkflowProgressEvent) => void;

type WorkflowOptions = {
  onProgress?: WorkflowProgressHandler;
};

type IndexDocumentFn = (document: DocumentDefinition) => Promise<void>;

function makeClient(apiToken: string, serverURL: string) {
  return new Glean({ apiToken, serverURL });
}

export function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function clip(value: string, maxLength: number) {
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

function formatDocumentLabel(document: DocumentDefinition) {
  return document.id ?? document.title ?? "unknown-document";
}

async function uploadDocuments(
  documents: DocumentDefinition[],
  indexDocument: IndexDocumentFn,
) {
  const results = await Promise.allSettled(
    documents.map(async (document) => {
      await indexDocument(document);
      return document;
    }),
  );

  return results.flatMap((result, index) =>
    result.status === "rejected"
      ? [
          {
            document: documents[index]!,
            error: result.reason,
          },
        ]
      : [],
  );
}

export async function indexDocumentsWithRetries(
  documents: DocumentDefinition[],
  datasource: string,
  indexDocument: IndexDocumentFn,
  options: WorkflowOptions = {},
) {
  let pendingDocuments = documents;
  const retriedDocumentIds = new Set<string>();

  for (let attempt = 1; attempt <= INGEST_MAX_ATTEMPTS; attempt += 1) {
    const failures = await uploadDocuments(pendingDocuments, indexDocument);

    if (failures.length === 0) {
      return {
        retriedDocumentIds: documents
          .map((document) => document.id)
          .filter(
            (documentId): documentId is string =>
              typeof documentId === "string" && retriedDocumentIds.has(documentId),
          ),
      };
    }

    const failedDocuments = failures.map((failure) => failure.document);

    if (attempt === INGEST_MAX_ATTEMPTS) {
      throw new Error(
        `Failed to index ${failedDocuments.length} document${failedDocuments.length === 1 ? "" : "s"} into datasource "${datasource}" after ${INGEST_MAX_ATTEMPTS} attempts. Failed document IDs: ${failedDocuments
          .map(formatDocumentLabel)
          .join(", ")}. Confirm the datasource name, required URL pattern, and token permissions for that datasource before retrying. Last error: ${formatError(
          failures[0]?.error,
        )}`,
        {
          cause: failures[0]?.error,
        },
      );
    }

    pendingDocuments = failedDocuments;
    pendingDocuments.forEach((document) => {
      if (document.id) {
        retriedDocumentIds.add(document.id);
      }
    });

    options.onProgress?.({
      kind: "message",
      message: `Attempt ${attempt} indexed ${documents.length - failedDocuments.length} of ${documents.length} fixture documents. Retrying only the ${failedDocuments.length} failed document${failedDocuments.length === 1 ? "" : "s"}...`,
    });
  }

  return {
    retriedDocumentIds: [],
  };
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
    viewURL: doc.url,
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
      allowedUsers: config.allowedUserEmails.map((email) => ({ email })),
      allowAnonymousAccess: false,
      allowAllDatasourceUsersAccess: false,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export async function ingestFixtureCorpus(
  config: IngestConfig,
  options: WorkflowOptions = {},
): Promise<IngestResult> {
  options.onProgress?.({
    kind: "message",
    message: "Loading fixture documents...",
  });
  const docs = await loadFixtureDocuments();
  options.onProgress?.({
    kind: "message",
    message: `Uploading ${docs.length} fixture documents to datasource "${config.datasource}"...`,
  });
  const documents = docs.map((doc) => toDocumentDefinition(doc, config));
  const indexingClient = makeClient(config.indexingApiToken, config.serverURL);

  try {
    const { retriedDocumentIds } = await indexDocumentsWithRetries(
      documents,
      config.datasource,
      async (document) => {
        await indexingClient.indexing.documents.addOrUpdate({
          document,
        });
      },
      options,
    );

    options.onProgress?.({
      kind: "message",
      message:
        retriedDocumentIds.length === 0
          ? `Indexed ${docs.length} fixture documents into datasource "${config.datasource}".`
          : `Indexed ${docs.length} fixture documents into datasource "${config.datasource}" after retrying ${retriedDocumentIds.length} failed document${retriedDocumentIds.length === 1 ? "" : "s"}.`,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Failed to index")) {
      throw error;
    }

    throw new Error(
      `Failed to index documents into datasource "${config.datasource}". Confirm the datasource name, required URL pattern, and token permissions for that datasource before retrying. Original error: ${formatError(
        error,
      )}`,
      {
        cause: error,
      },
    );
  }

  return {
    datasource: config.datasource,
    indexedCount: docs.length,
    documentIds: docs.map((doc) => doc.id),
    documentTitles: docs.map((doc) => doc.title),
  };
}

function searchResultToSource(result: SearchResult): AskSource {
  const snippet =
    result.snippets
      ?.map((candidate) => candidate.text ?? "")
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
    timeoutMillis: SEARCH_TIMEOUT_MILLIS,
  });

  const sources = (response.results ?? []).map(searchResultToSource);

  return { sources, response };
}

export function buildGroundedPrompt(question: string, sources: AskSource[]) {
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

export function extractAssistantText(messages: ChatMessage[] | undefined) {
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

export function buildCitationAppendix(sources: AskSource[]) {
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
  options: WorkflowOptions = {},
): Promise<AskQuestionResult> {
  options.onProgress?.({
    kind: "timed-start",
    display: "message",
    message: `Searching datasource "${config.datasource}"...`,
    timeoutMillis: SEARCH_TIMEOUT_MILLIS,
  });
  const { response, sources } = await retrieveSources(config, question);
  options.onProgress?.({
    kind: "timed-end",
    message: `Search completed with ${sources.length} source${sources.length === 1 ? "" : "s"}.`,
  });

  if (sources.length === 0) {
    throw new Error(
      `No relevant documents were found in datasource "${config.datasource}". Run the ingest command first, wait a few minutes for asynchronous processing to complete, and confirm the indexing token can write to that datasource.`,
    );
  }

  options.onProgress?.({
    kind: "timed-start",
    display: "bar",
    message: `Generating grounded answer from ${sources.length} source${sources.length === 1 ? "" : "s"}...`,
    timeoutMillis: CHAT_TIMEOUT_MILLIS,
  });
  const chatClient = makeClient(config.clientApiToken, config.serverURL);
  const chatResponse = await chatClient.client.chat.create({
    messages: [
      {
        author: "USER",
        fragments: [{ text: buildGroundedPrompt(question, sources) }],
      },
    ],
    timeoutMillis: CHAT_TIMEOUT_MILLIS,
  }, undefined, undefined, config.clientActAs
    ? {
        headers: {
          "X-Glean-ActAs": config.clientActAs,
        },
      }
    : undefined);

  const assistantText = extractAssistantText(chatResponse.messages);

  if (!assistantText) {
    throw new Error(
      "Glean Chat returned an empty response. Verify the chat token and try again.",
    );
  }

  options.onProgress?.({
    kind: "timed-end",
    message: "Answer ready.",
  });
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
