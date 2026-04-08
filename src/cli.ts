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

function readStringFlag(
  parsed: ParsedArgs,
  key: string,
): string | undefined {
  const value = parsed.flags[key];
  return typeof value === "string" ? value : undefined;
}

function readBooleanFlag(parsed: ParsedArgs, key: string) {
  const value = parsed.flags[key];

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value !== "false";
  }

  return undefined;
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

function printUsage() {
  console.log(`Usage:
  npm run ingest -- [--allowed-user-email user@example.com] [--datasource interviewds]
  npm run ask -- --question "What is the remote work policy?" [--datasource interviewds] [--top-k 4] [--include-citations true]`);
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const [command] = parsed._;

  if (command === "ingest") {
    const config = loadIngestConfig({
      datasource: readStringFlag(parsed, "datasource"),
      allowedUserEmail: readStringFlag(parsed, "allowed-user-email"),
    });

    const result = await ingestFixtureCorpus(config);
    const sampleTitles = result.documentTitles.slice(0, 3).join(", ");

    console.log(JSON.stringify(result, null, 2));
    console.log(
      `\nIndexed content should now be discoverable in datasource "${result.datasource}".`,
    );
    console.log(
      `Search Glean for one of these titles to confirm it: ${sampleTitles}.`,
    );
    console.log(
      `Or run: npm run ask -- --datasource ${result.datasource} --question "Can I work remotely while attending a conference abroad?"`,
    );
    return;
  }

  if (command === "ask") {
    const question = readStringFlag(parsed, "question");

    if (!question) {
      throw new Error("Missing --question for ask command.");
    }

    const config = loadAskConfig({
      datasource: readStringFlag(parsed, "datasource"),
      topK: readNumberFlag(parsed, "top-k"),
      includeCitations: readBooleanFlag(parsed, "include-citations"),
    });

    const result = await askQuestion(config, question);

    console.log(result.answer);
    return;
  }

  printUsage();
  throw new Error(`Unknown command: ${command ?? "(missing)"}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
