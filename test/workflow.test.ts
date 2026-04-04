import test from "node:test";
import assert from "node:assert/strict";

import type { ChatMessage } from "@gleanwork/api-client/models/components";

import type { AskSource } from "../src/types.ts";
import {
  buildCitationAppendix,
  buildDatasourceViewURL,
  buildGroundedPrompt,
  clip,
  compactWhitespace,
  extractAssistantText,
} from "../src/workflow.ts";

test("buildDatasourceViewURL matches datasource URL shape", () => {
  assert.equal(
    buildDatasourceViewURL("interviewds", "remote-work-policy"),
    "https://internal.company.com/interviewds/remote-work-policy",
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
      url: "https://internal.company.com/interviewds/remote-work-policy",
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
      url: "https://internal.company.com/interviewds/travel-policy",
      snippet: "Travel requires manager approval.",
      datasource: "CUSTOM_INTERVIEWDS",
    },
    {
      id: null,
      title: "Remote Work Policy",
      url: "https://internal.company.com/interviewds/remote-work-policy",
      snippet: "Remote work abroad is limited.",
      datasource: "CUSTOM_INTERVIEWDS",
    },
  ]);

  assert.match(appendix, /\[1\] Travel Policy \(doc-1\)/);
  assert.match(appendix, /\[2\] Remote Work Policy \(no-id\)/);
});
