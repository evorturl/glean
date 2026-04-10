import {
  parseArgs,
  readBooleanFlag,
  readNumberFlag,
  readStringFlag,
} from "./cli-flags.js";
import { loadAskConfig, loadIngestConfig } from "./config.js";
import {
  askQuestion,
  ingestFixtureCorpus,
  type WorkflowProgressEvent,
} from "./workflow.js";

function printUsage() {
  console.log(`Usage:
  npm run ingest -- [--allowed-user-emails user1@example.com,user2@example.com] [--datasource interviewds]
  npm run ask -- --question "What is the remote work policy?" [--datasource interviewds] [--top-k 4] [--include-citations true]`);
}

type ActiveTimedProgress = {
  interval: NodeJS.Timeout;
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

function renderTimedProgress(message: string, startedAt: number, timeoutMillis: number) {
  const elapsedMillis = Date.now() - startedAt;
  const bar = buildProgressBar(elapsedMillis, timeoutMillis);
  const line =
    `[progress] ${message} [${bar}] ` +
    `${formatDuration(elapsedMillis)} / ${formatDuration(timeoutMillis)}`;

  process.stderr.write(`\r${line}`);
}

function stopTimedProgress(finalMessage?: string) {
  if (!activeTimedProgress) {
    if (finalMessage) {
      console.error(`[progress] ${finalMessage}`);
    }
    return;
  }

  clearInterval(activeTimedProgress.interval);
  if (process.stderr.isTTY) {
    renderTimedProgress(
      activeTimedProgress.message,
      activeTimedProgress.startedAt,
      activeTimedProgress.timeoutMillis,
    );
    process.stderr.write("\n");
  }
  activeTimedProgress = null;

  if (finalMessage) {
    console.error(`[progress] ${finalMessage}`);
  }
}

function startTimedProgress(message: string, timeoutMillis: number) {
  stopTimedProgress();

  if (!process.stderr.isTTY) {
    console.error(
      `[progress] ${message} (timeout ${formatDuration(timeoutMillis)})`,
    );
    return;
  }

  const startedAt = Date.now();
  renderTimedProgress(message, startedAt, timeoutMillis);

  activeTimedProgress = {
    message,
    startedAt,
    timeoutMillis,
    interval: setInterval(() => {
      renderTimedProgress(message, startedAt, timeoutMillis);
    }, 100),
  };
}

function reportProgress(event: WorkflowProgressEvent) {
  if (event.kind === "message") {
    stopTimedProgress();
    console.error(`[progress] ${event.message}`);
    return;
  }

  if (event.kind === "timed-start") {
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
      includeCitations: readBooleanFlag(parsed, [
        "include-citations",
        "includeCitations",
      ]),
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
