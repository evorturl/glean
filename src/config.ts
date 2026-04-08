import path from "node:path";

import { config as loadDotenv } from "dotenv";
import { z } from "zod";

const localEnvPath = path.resolve(process.cwd(), "env/local.env");

loadDotenv({ path: localEnvPath, override: false });
loadDotenv();

const baseEnvSchema = z.object({
  GLEAN_INSTANCE: z.string().min(1).default("support-lab"),
  GLEAN_SERVER_URL: z.url().optional(),
  GLEAN_DEFAULT_DATASOURCE: z.string().min(1).default("interviewds"),
  GLEAN_DEFAULT_TOP_K: z.coerce.number().int().positive().default(4),
  GLEAN_ALLOWED_USER_EMAIL: z.email().optional(),
  GLEAN_INDEXING_API_TOKEN: z.string().min(1).optional(),
  GLEAN_SEARCH_API_TOKEN: z.string().min(1).optional(),
  GLEAN_CLIENT_API_TOKEN: z.string().min(1).optional(),
  GLEAN_CLIENT_ACT_AS: z.email().optional(),
});

export type BaseConfig = {
  instance: string;
  serverURL: string;
  defaultDatasource: string;
  defaultTopK: number;
};

export type IngestConfig = BaseConfig & {
  indexingApiToken: string;
  datasource: string;
  allowedUserEmail: string;
};

export type AskConfig = BaseConfig & {
  searchApiToken: string;
  clientApiToken: string;
  clientActAs?: string;
  datasource: string;
  topK: number;
  includeCitations: boolean;
};

function loadBaseEnv() {
  return baseEnvSchema.parse(process.env);
}

export function deriveServerURL(instance: string, override?: string) {
  return override ?? `https://${instance}-be.glean.com`;
}

function getBaseConfig(): BaseConfig {
  const env = loadBaseEnv();

  return {
    instance: env.GLEAN_INSTANCE,
    serverURL: deriveServerURL(env.GLEAN_INSTANCE, env.GLEAN_SERVER_URL),
    defaultDatasource: env.GLEAN_DEFAULT_DATASOURCE,
    defaultTopK: env.GLEAN_DEFAULT_TOP_K,
  };
}

function requireToken(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to env/local.env before running this command.`,
    );
  }

  return value;
}

export function loadIngestConfig(options: {
  datasource?: string;
  allowedUserEmail?: string;
}): IngestConfig {
  const base = getBaseConfig();
  const env = loadBaseEnv();
  const allowedUserEmail =
    options.allowedUserEmail ??
    env.GLEAN_ALLOWED_USER_EMAIL ??
    env.GLEAN_CLIENT_ACT_AS;

  if (!allowedUserEmail) {
    throw new Error(
      "Missing allowed user email. Set GLEAN_ALLOWED_USER_EMAIL in env/local.env, reuse GLEAN_CLIENT_ACT_AS, or pass --allowed-user-email so indexed docs are visible to the sandbox user.",
    );
  }

  return {
    ...base,
    indexingApiToken: requireToken(
      "GLEAN_INDEXING_API_TOKEN",
      env.GLEAN_INDEXING_API_TOKEN,
    ),
    datasource: options.datasource ?? base.defaultDatasource,
    allowedUserEmail,
  };
}

export function loadAskConfig(options: {
  datasource?: string;
  topK?: number;
  includeCitations?: boolean;
}): AskConfig {
  const base = getBaseConfig();
  const env = loadBaseEnv();

  return {
    ...base,
    searchApiToken: requireToken(
      "GLEAN_SEARCH_API_TOKEN",
      env.GLEAN_SEARCH_API_TOKEN,
    ),
    clientApiToken: requireToken(
      "GLEAN_CLIENT_API_TOKEN",
      env.GLEAN_CLIENT_API_TOKEN,
    ),
    clientActAs: env.GLEAN_CLIENT_ACT_AS,
    datasource: options.datasource ?? base.defaultDatasource,
    topK: options.topK ?? base.defaultTopK,
    includeCitations: options.includeCitations ?? true,
  };
}
