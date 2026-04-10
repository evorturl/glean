import { loadAskConfig, loadIngestConfig } from "./config.js";
import {
  askQuestion,
  ingestFixtureCorpus,
  type WorkflowProgressEvent,
} from "./workflow.js";

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

function printUsage() {
  console.log(`Usage:
  npm run ingest -- [--allowed-user-emails user1@example.com,user2@example.com] [--datasource interviewds]
  npm run ask -- --question "What is the remote work policy?" [--datasource interviewds] [--top-k 4] [--include-citations true]`);
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

function readStringFlag(
  parsed: ParsedArgs,
  key: string,
): string | undefined {
  const value = parsed.flags[key];
  return typeof value === "string" ? value : undefined;
}

type ActiveTimedProgress = {
  interval: NodeJS.Timeout | null;
  isLive: boolean;
  message: string;
  startedAt: number;
  timeoutMillis: number;
};

let activeTimedProgress: ActiveTimedProgress | null = null;

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function buildProgressBar(
  elapsedMillis: number,
  timeoutMillis: number,
  width = 20,
) {
  const ratio = Math.min(elapsedMillis / timeoutMillis, 1);
  const filled = Math.round(ratio * width);
  return `${"=".repeat(filled)}${"-".repeat(Math.max(width - filled, 0))}`;
}

function buildTimedProgressLine(
  message: string,
  startedAt: number,
  timeoutMillis: number,
  summary?: string,
) {
  const elapsedMillis = Date.now() - startedAt;
  const bar = buildProgressBar(elapsedMillis, timeoutMillis);
  const prefix =
    `[progress] ${message} [${bar}] ` +
    `${formatDuration(elapsedMillis)} / ${formatDuration(timeoutMillis)}`;

  return summary ? `${prefix} - ${summary}` : prefix;
}

function renderTimedProgress(
  message: string,
  startedAt: number,
  timeoutMillis: number,
) {
  process.stderr.write(
    `\r${buildTimedProgressLine(message, startedAt, timeoutMillis)}`,
  );
}

function stopTimedProgress(finalMessage?: string) {
  if (!activeTimedProgress) {
    if (finalMessage) {
      console.error(`[progress] ${finalMessage}`);
    }
    return;
  }

  if (activeTimedProgress.interval) {
    clearInterval(activeTimedProgress.interval);
  }

  const finalLine = buildTimedProgressLine(
    activeTimedProgress.message,
    activeTimedProgress.startedAt,
    activeTimedProgress.timeoutMillis,
    finalMessage,
  );

  if (activeTimedProgress.isLive) {
    process.stderr.write(`\r${finalLine}\n`);
  } else {
    console.error(finalLine);
  }

  activeTimedProgress = null;
}

function startTimedProgress(message: string, timeoutMillis: number) {
  stopTimedProgress();

  const startedAt = Date.now();

  if (process.stderr.isTTY) {
    renderTimedProgress(message, startedAt, timeoutMillis);

    activeTimedProgress = {
      interval: setInterval(() => {
        renderTimedProgress(message, startedAt, timeoutMillis);
      }, 100),
      isLive: true,
      message,
      startedAt,
      timeoutMillis,
    };
    return;
  }

  console.error(
    `[progress] ${message} (timeout ${formatDuration(timeoutMillis)})`,
  );

  activeTimedProgress = {
    interval: null,
    isLive: false,
    message,
    startedAt,
    timeoutMillis,
  };
}

function reportProgress(event: WorkflowProgressEvent) {
  if (event.kind === "message") {
    stopTimedProgress();
    console.error(`[progress] ${event.message}`);
    return;
  }

  if (event.kind === "timed-start") {
    if (event.display === "message") {
      stopTimedProgress();
      console.error(`[progress] ${event.message}`);
      return;
    }

    startTimedProgress(event.message, event.timeoutMillis);
    return;
  }

  stopTimedProgress(event.message);
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const [command] = parsed._;

  if (command === "ingest") {
    const config = loadIngestConfig({
      datasource: readStringFlag(parsed, "datasource"),
      allowedUserEmails: readStringFlag(parsed, "allowed-user-emails"),
    });

    const result = await ingestFixtureCorpus(config, {
      onProgress: reportProgress,
    });
    const sampleTitles = result.documentTitles.slice(0, 3).join(", ");

    console.log(JSON.stringify(result, null, 2));
    console.log(
      "\nGlean processes uploaded documents asynchronously, so new content can take a few minutes to appear in search.",
    );
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

    const result = await askQuestion(config, question, {
      onProgress: reportProgress,
    });

    console.log(result.answer);
    return;
  }

  printUsage();
  throw new Error(`Unknown command: ${command ?? "(missing)"}`);
}

main().catch((error) => {
  stopTimedProgress();
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
