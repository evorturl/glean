import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { loadAskConfig } from "./config.js";
import { askQuestion } from "./workflow.js";

function serializeResult(result: Awaited<ReturnType<typeof askQuestion>>) {
  return JSON.stringify(result, null, 2);
}

async function main() {
  const server = new McpServer({
    name: "glean-employee-support",
    version: "0.1.0",
  });

  server.registerTool(
    "ask_company_docs",
    {
      title: "Ask Company Docs",
      description:
        "Answer employee questions from the indexed sandbox datasource and return the supporting sources.",
      inputSchema: {
        question: z.string().min(1).describe("Natural-language employee question."),
        datasource: z
          .string()
          .min(1)
          .optional()
          .describe("Sandbox datasource to search. Defaults to the configured datasource."),
        topK: z
          .number()
          .int()
          .positive()
          .max(10)
          .optional()
          .describe("How many search hits to retrieve before generating the answer."),
        includeCitations: z
          .boolean()
          .optional()
          .describe("Whether to append a citation appendix to the answer."),
      },
    },
    async ({ question, datasource, topK, includeCitations }) => {
      const config = loadAskConfig({
        datasource,
        topK,
        includeCitations,
      });
      const result = await askQuestion(config, question);

      return {
        content: [
          {
            type: "text",
            text: serializeResult(result),
          },
        ],
        structuredContent: result,
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
