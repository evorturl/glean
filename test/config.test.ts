import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveServerURL,
  loadAskConfig,
  loadIngestConfig,
} from "../src/config.ts";

const originalEnv = { ...process.env };

test.afterEach(() => {
  process.env = { ...originalEnv };
});

test("deriveServerURL falls back to instance backend URL", () => {
  assert.equal(
    deriveServerURL("support-lab"),
    "https://support-lab-be.glean.com",
  );
});

test("loadIngestConfig uses defaults and required values", () => {
  process.env.GLEAN_INSTANCE = "support-lab";
  process.env.GLEAN_DEFAULT_DATASOURCE = "interviewds";
  process.env.GLEAN_INDEXING_API_TOKEN = "index-token";

  const config = loadIngestConfig({
    allowedUserEmail: "alex@glean-sandbox.com",
  });

  assert.equal(config.datasource, "interviewds");
  assert.equal(config.indexingApiToken, "index-token");
  assert.equal(config.allowedUserEmail, "alex@glean-sandbox.com");
});

test("loadIngestConfig falls back to env for allowed user email", () => {
  process.env.GLEAN_INSTANCE = "support-lab";
  process.env.GLEAN_DEFAULT_DATASOURCE = "interviewds";
  process.env.GLEAN_INDEXING_API_TOKEN = "index-token";
  process.env.GLEAN_ALLOWED_USER_EMAIL = "alex@glean-sandbox.com";

  const config = loadIngestConfig({});

  assert.equal(config.allowedUserEmail, "alex@glean-sandbox.com");
});

test("loadIngestConfig reuses act-as identity when allowed user email is unset", () => {
  process.env.GLEAN_INSTANCE = "support-lab";
  process.env.GLEAN_DEFAULT_DATASOURCE = "interviewds";
  process.env.GLEAN_INDEXING_API_TOKEN = "index-token";
  process.env.GLEAN_CLIENT_ACT_AS = "alex@glean-sandbox.com";

  const config = loadIngestConfig({});

  assert.equal(config.allowedUserEmail, "alex@glean-sandbox.com");
});

test("loadAskConfig preserves optional chat act-as identity", () => {
  process.env.GLEAN_INSTANCE = "support-lab";
  process.env.GLEAN_DEFAULT_DATASOURCE = "interviewds";
  process.env.GLEAN_SEARCH_API_TOKEN = "search-token";
  process.env.GLEAN_CLIENT_API_TOKEN = "client-token";
  process.env.GLEAN_CLIENT_ACT_AS = "alex@glean-sandbox.com";

  const config = loadAskConfig({
    topK: 6,
    includeCitations: false,
  });

  assert.equal(config.datasource, "interviewds");
  assert.equal(config.topK, 6);
  assert.equal(config.includeCitations, false);
  assert.equal(config.clientActAs, "alex@glean-sandbox.com");
});

test("loadIngestConfig fails when allowed user email is missing", () => {
  process.env.GLEAN_INDEXING_API_TOKEN = "index-token";

  assert.throws(
    () => loadIngestConfig({}),
    /Missing allowed user email/,
  );
});
