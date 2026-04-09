import path from "node:path";

import { config as loadDotenv } from "dotenv";
import { z } from "zod";

const envDirectory = path.resolve(process.cwd(), "env");
const secretsEnvPath = path.join(envDirectory, "secrets.env");
const variablesEnvPath = path.join(envDirectory, "variables.env");
const emailSchema = z.email();

loadDotenv({ path: variablesEnvPath, override: false });
loadDotenv({ path: secretsEnvPath, override: false });

const optionalEnvSchema = z.object({
  GLEAN_ALLOWED_USER_EMAILS: z.string().optional(),
  GLEAN_CLIENT_ACT_AS: z.email().optional(),
  GLEAN_SERVER_URL: z.url().optional(),
});

type OptionalEnv = z.infer<typeof optionalEnvSchema>;

export type AskConfig = BaseConfig & {
  clientApiToken: string;
  clientActAs?: string;
  datasource: string;
  includeCitations: boolean;
  searchApiToken: string;
  topK: number;
};

export type BaseConfig = {
  defaultDatasource: string;
  defaultTopK: number;
  instance: string;
  serverURL: string;
};

export type IngestConfig = BaseConfig & {
  allowedUserEmails: string[];
  datasource: string;
  indexingApiToken: string;
};

function readOptionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function requirePositiveIntEnv(name: string, filePath: string) {
  const value = requireStringEnv(name, filePath);
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid ${name}: expected a positive integer in ${filePath}, received "${value}".`,
    );
  }

  return parsed;
}

function loadOptionalEnv(): OptionalEnv {
  return optionalEnvSchema.parse(process.env);
}

function parseEmailList(value: string | undefined, sourceLabel: string) {
  if (!value) {
    return [];
  }

  const emails = value
    .split(",")
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate.length > 0);

  if (emails.length === 0) {
    return [];
  }

  return emails.map((email) => {
    try {
      return emailSchema.parse(email);
    } catch {
      throw new Error(
        `Invalid email "${email}" in ${sourceLabel}. Use a comma-separated list of valid email addresses.`,
      );
    }
  });
}

function readAllowedUserEmails(options: {
  allowedUserEmails?: string;
}, env: OptionalEnv) {
  const sources = [
    {
      label: "--allowed-user-emails",
      value: options.allowedUserEmails,
    },
    {
      label: "GLEAN_ALLOWED_USER_EMAILS in env/variables.env",
      value: env.GLEAN_ALLOWED_USER_EMAILS,
    },
    {
      label: "GLEAN_CLIENT_ACT_AS in env/variables.env",
      value: env.GLEAN_CLIENT_ACT_AS,
    },
  ];

  for (const source of sources) {
    const emails = parseEmailList(source.value, source.label);

    if (emails.length > 0) {
      return [...new Set(emails.map((email) => email.toLowerCase()))];
    }
  }

  return [];
}

export function deriveServerURL(instance: string, override?: string) {
  return override ?? `https://${instance}-be.glean.com`;
}

function getBaseConfig(): BaseConfig {
  const env = loadOptionalEnv();
  const instance = requireStringEnv("GLEAN_INSTANCE", "env/variables.env");

  return {
    instance,
    serverURL: deriveServerURL(instance, env.GLEAN_SERVER_URL),
    defaultDatasource: requireStringEnv(
      "GLEAN_DEFAULT_DATASOURCE",
      "env/variables.env",
    ),
    defaultTopK: requirePositiveIntEnv(
      "GLEAN_DEFAULT_TOP_K",
      "env/variables.env",
    ),
  };
}

function requireStringEnv(name: string, filePath: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to ${filePath} before running this command.`,
    );
  }

  return value;
}

function requireToken(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to env/secrets.env before running this command.`,
    );
  }

  return value;
}

export function loadIngestConfig(options: {
  datasource?: string;
  allowedUserEmails?: string;
}): IngestConfig {
  const base = getBaseConfig();
  const env = loadOptionalEnv();
  const allowedUserEmails = readAllowedUserEmails(options, env);

  if (allowedUserEmails.length === 0) {
    throw new Error(
      "Missing allowed user email. Set GLEAN_ALLOWED_USER_EMAILS or GLEAN_CLIENT_ACT_AS in env/variables.env, or pass --allowed-user-emails so indexed docs are visible to the sandbox user.",
    );
  }

  return {
    ...base,
    indexingApiToken: requireToken(
      "GLEAN_INDEXING_API_TOKEN",
      readOptionalEnv("GLEAN_INDEXING_API_TOKEN"),
    ),
    datasource: options.datasource ?? base.defaultDatasource,
    allowedUserEmails,
  };
}

export function loadAskConfig(options: {
  datasource?: string;
  topK?: number;
  includeCitations?: boolean;
}): AskConfig {
  const base = getBaseConfig();
  const env = loadOptionalEnv();

  return {
    ...base,
    searchApiToken: requireToken(
      "GLEAN_SEARCH_API_TOKEN",
      readOptionalEnv("GLEAN_SEARCH_API_TOKEN"),
    ),
    clientApiToken: requireToken(
      "GLEAN_CLIENT_API_TOKEN",
      readOptionalEnv("GLEAN_CLIENT_API_TOKEN"),
    ),
    clientActAs: env.GLEAN_CLIENT_ACT_AS,
    datasource: options.datasource ?? base.defaultDatasource,
    topK: options.topK ?? base.defaultTopK,
    includeCitations: options.includeCitations ?? true,
  };
}
