import { loadAskConfig, loadIngestConfig } from "./config.js";
import { askQuestion, ingestFixtureCorpus } from "./workflow.js";

type ParsedArgs = {
  _: string[];
  flags: Record<string, string | boolean>;
};

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = { _: [], flags: {} };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token) {
      continue;
    }

    if (!token.startsWith("--")) {
      parsed._.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      parsed.flags[key] = true;
      continue;
    }

    parsed.flags[key] = next;
    index += 1;
  }

  return parsed;
}

function readNumberFlag(parsed: ParsedArgs, key: string) {
  const value = readStringFlag(parsed, key);

  if (!value) {
    return undefined;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`Invalid numeric value for --${key}: ${value}`);
  }

  return number;
}

function readStringFlag(
  parsed: ParsedArgs,
  key: string,
): string | undefined {
  const value = parsed.flags[key];
  return typeof value === "string" ? value : undefined;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const datasource = readStringFlag(parsed, "datasource");
  const allowedUserEmails = readStringFlag(parsed, "allowed-user-emails");
  const question =
    readStringFlag(parsed, "question") ??
    "Can I work remotely while attending a conference abroad?";
  const topK = readNumberFlag(parsed, "top-k");

  const ingestConfig = loadIngestConfig({
    datasource,
    allowedUserEmails,
  });
  const askConfig = loadAskConfig({
    datasource,
    topK,
    includeCitations: true,
  });

  const ingestResult = await ingestFixtureCorpus(ingestConfig);
  const askResult = await askQuestion(askConfig, question);

  if (!askResult.answer.trim()) {
    throw new Error("E2E validation failed: answer was empty.");
  }

  if (askResult.sources.length === 0) {
    throw new Error("E2E validation failed: no sources were returned.");
  }

  console.log(
    JSON.stringify(
      {
        ingest: ingestResult,
        ask: {
          datasource: askResult.datasource,
          sourceCount: askResult.sources.length,
          answerPreview: askResult.answer.slice(0, 240),
          searchRequestId: askResult.searchRequestId,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
