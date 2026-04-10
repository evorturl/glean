import test from "node:test";
import assert from "node:assert/strict";

import type { ChatMessage } from "@gleanwork/api-client/models/components";
import type { DocumentDefinition } from "@gleanwork/api-client/models/components";

import { loadFixtureDocuments } from "../src/fixtures.ts";
import type { AskSource } from "../src/types.ts";
import {
  buildCitationAppendix,
  buildGroundedPrompt,
  clip,
  compactWhitespace,
  extractAssistantText,
  indexDocumentsWithRetries,
} from "../src/workflow.ts";

function makeDocumentDefinition(id: string): DocumentDefinition {
  return {
    datasource: "interviewds",
    id,
    objectType: "Document",
    title: `Document ${id}`,
    viewURL: `https://example.com/${id}`,
  };
}

test("fixture definitions include canonical GitHub URLs", async () => {
  const docs = await loadFixtureDocuments();
  const remoteWorkPolicy = docs.find((doc) => doc.id === "remote-work-policy");

  assert.ok(remoteWorkPolicy);
  assert.equal(
    remoteWorkPolicy.url,
    "https://github.com/evorturl/glean/blob/main/fixtures/employee-support/remote-work-policy.md",
  );
});

test("compactWhitespace normalizes embedded whitespace", () => {
  assert.equal(
    compactWhitespace("  remote   work\n policy\tguide "),
    "remote work policy guide",
  );
});

test("clip truncates overly long values", () => {
  assert.equal(clip("abcdef", 5), "abcd...");
});

test("buildGroundedPrompt includes question and sources", () => {
  const sources: AskSource[] = [
    {
      id: "remote-work-policy",
      title: "Remote Work Policy",
      url: "https://github.com/evorturl/glean/blob/main/fixtures/employee-support/remote-work-policy.md",
      snippet: "International remote work is limited to 15 business days.",
      datasource: "CUSTOM_INTERVIEWDS",
    },
  ];

  const prompt = buildGroundedPrompt(
    "Can I work remotely abroad?",
    sources,
  );

  assert.match(prompt, /Question: Can I work remotely abroad\?/);
  assert.match(prompt, /Source \[1\]/);
  assert.match(prompt, /Remote Work Policy/);
});

test("extractAssistantText returns the latest non-empty response text", () => {
  const messages: ChatMessage[] = [
    {
      author: "USER",
      fragments: [{ text: "Question" }],
    },
    {
      author: "GLEAN_AI",
      fragments: [{ text: "" }],
    },
    {
      author: "GLEAN_AI",
      fragments: [{ text: "Grounded answer" }],
    },
  ];

  assert.equal(extractAssistantText(messages), "Grounded answer");
});

test("buildCitationAppendix formats all sources predictably", () => {
  const appendix = buildCitationAppendix([
    {
      id: "doc-1",
      title: "Travel Policy",
      url: "https://github.com/evorturl/glean/blob/main/fixtures/employee-support/travel-and-conference-policy.md",
      snippet: "Travel requires manager approval.",
      datasource: "CUSTOM_INTERVIEWDS",
    },
    {
      id: null,
      title: "Remote Work Policy",
      url: "https://github.com/evorturl/glean/blob/main/fixtures/employee-support/remote-work-policy.md",
      snippet: "Remote work abroad is limited.",
      datasource: "CUSTOM_INTERVIEWDS",
    },
  ]);

  assert.match(appendix, /\[1\] Travel Policy \(doc-1\)/);
  assert.match(appendix, /\[2\] Remote Work Policy \(no-id\)/);
});

test("indexDocumentsWithRetries retries only previously failed documents", async () => {
  const documents = [
    makeDocumentDefinition("doc-1"),
    makeDocumentDefinition("doc-2"),
    makeDocumentDefinition("doc-3"),
  ];
  const attemptedDocumentIds: string[] = [];
  const attemptCounts = new Map<string, number>();

  const result = await indexDocumentsWithRetries(
    documents,
    "interviewds",
    async (document) => {
      const documentId = document.id ?? "unknown";
      const attemptCount = (attemptCounts.get(documentId) ?? 0) + 1;

      attemptCounts.set(documentId, attemptCount);
      attemptedDocumentIds.push(documentId);

      if (documentId !== "doc-1" && attemptCount === 1) {
        throw new Error(`Temporary failure for ${documentId}`);
      }
    },
  );

  assert.deepEqual(attemptedDocumentIds, [
    "doc-1",
    "doc-2",
    "doc-3",
    "doc-2",
    "doc-3",
  ]);
  assert.deepEqual(result.retriedDocumentIds, ["doc-2", "doc-3"]);
});

test("indexDocumentsWithRetries surfaces final failed document ids", async () => {
  const documents = [
    makeDocumentDefinition("doc-1"),
    makeDocumentDefinition("doc-2"),
  ];
  const attemptedDocumentIds: string[] = [];

  await assert.rejects(
    indexDocumentsWithRetries(documents, "interviewds", async (document) => {
      const documentId = document.id ?? "unknown";

      attemptedDocumentIds.push(documentId);

      if (documentId === "doc-2") {
        throw new Error("Permanent failure");
      }
    }),
    /Failed document IDs: doc-2/,
  );

  assert.deepEqual(attemptedDocumentIds, ["doc-1", "doc-2", "doc-2"]);
});
