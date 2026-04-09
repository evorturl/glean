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

function setRequiredBaseEnv() {
  process.env.GLEAN_INSTANCE = "support-lab";
  process.env.GLEAN_DEFAULT_DATASOURCE = "interviewds";
  process.env.GLEAN_DEFAULT_TOP_K = "4";
}

test("deriveServerURL falls back to instance backend URL", () => {
  assert.equal(
    deriveServerURL("support-lab"),
    "https://support-lab-be.glean.com",
  );
});

test("loadIngestConfig uses configured base values and required tokens", () => {
  setRequiredBaseEnv();
  process.env.GLEAN_INDEXING_API_TOKEN = "index-token";

  const config = loadIngestConfig({
    allowedUserEmails: "alex@glean-sandbox.com",
  });

  assert.equal(config.datasource, "interviewds");
  assert.equal(config.indexingApiToken, "index-token");
  assert.deepEqual(config.allowedUserEmails, ["alex@glean-sandbox.com"]);
});

test("loadIngestConfig falls back to env for allowed user email", () => {
  setRequiredBaseEnv();
  process.env.GLEAN_INDEXING_API_TOKEN = "index-token";
  process.env.GLEAN_ALLOWED_USER_EMAILS = "alex@glean-sandbox.com";

  const config = loadIngestConfig({});

  assert.deepEqual(config.allowedUserEmails, ["alex@glean-sandbox.com"]);
});

test("loadIngestConfig accepts multiple allowed users from env", () => {
  setRequiredBaseEnv();
  process.env.GLEAN_INDEXING_API_TOKEN = "index-token";
  process.env.GLEAN_ALLOWED_USER_EMAILS =
    "alex@glean-sandbox.com, sam@glean-sandbox.com";

  const config = loadIngestConfig({});

  assert.deepEqual(config.allowedUserEmails, [
    "alex@glean-sandbox.com",
    "sam@glean-sandbox.com",
  ]);
});

test("loadIngestConfig reuses act-as identity when allowed user email is unset", () => {
  setRequiredBaseEnv();
  process.env.GLEAN_INDEXING_API_TOKEN = "index-token";
  process.env.GLEAN_CLIENT_ACT_AS = "alex@glean-sandbox.com";

  const config = loadIngestConfig({});

  assert.deepEqual(config.allowedUserEmails, ["alex@glean-sandbox.com"]);
});

test("loadIngestConfig accepts multiple allowed users from CLI options", () => {
  setRequiredBaseEnv();
  process.env.GLEAN_INDEXING_API_TOKEN = "index-token";

  const config = loadIngestConfig({
    allowedUserEmails: "alex@glean-sandbox.com,sam@glean-sandbox.com",
  });

  assert.deepEqual(config.allowedUserEmails, [
    "alex@glean-sandbox.com",
    "sam@glean-sandbox.com",
  ]);
});

test("loadAskConfig preserves optional chat act-as identity", () => {
  setRequiredBaseEnv();
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
  setRequiredBaseEnv();
  delete process.env.GLEAN_ALLOWED_USER_EMAILS;
  delete process.env.GLEAN_CLIENT_ACT_AS;
  process.env.GLEAN_INDEXING_API_TOKEN = "index-token";

  assert.throws(
    () => loadIngestConfig({}),
    /Missing allowed user email/,
  );
});

test("loadIngestConfig fails when required base variables are missing", () => {
  delete process.env.GLEAN_INSTANCE;
  delete process.env.GLEAN_DEFAULT_DATASOURCE;
  delete process.env.GLEAN_DEFAULT_TOP_K;
  process.env.GLEAN_INDEXING_API_TOKEN = "index-token";
  process.env.GLEAN_ALLOWED_USER_EMAILS = "alex@glean-sandbox.com";

  assert.throws(
    () => loadIngestConfig({}),
    /Missing GLEAN_INSTANCE/,
  );
});
