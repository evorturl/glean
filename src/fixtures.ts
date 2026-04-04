import { readFile } from "node:fs/promises";
import path from "node:path";

import type { FixtureDocument } from "./types.js";

type FixtureDefinition = Omit<FixtureDocument, "body">;

const fixtureDirectory = path.resolve(
  process.cwd(),
  "fixtures/employee-support",
);

const fixtureDefinitions: FixtureDefinition[] = [
  {
    id: "remote-work-policy",
    title: "Remote Work Policy",
    filename: "remote-work-policy.md",
    summary:
      "Explains hybrid schedule expectations, remote work abroad limits, and approval requirements.",
    tags: ["policy", "remote-work", "people-ops"],
  },
  {
    id: "paid-time-off-and-holidays",
    title: "Paid Time Off and Holidays",
    filename: "paid-time-off-and-holidays.md",
    summary:
      "Covers PTO allowances, holiday schedule, and manager approval timing.",
    tags: ["policy", "pto", "holidays"],
  },
  {
    id: "it-help-desk-onboarding",
    title: "IT Help Desk Onboarding Guide",
    filename: "it-help-desk-onboarding.md",
    summary:
      "Describes new-hire laptop setup, VPN, MFA, and IT support response times.",
    tags: ["it", "support", "onboarding"],
  },
  {
    id: "expense-reimbursement-policy",
    title: "Expense Reimbursement Policy",
    filename: "expense-reimbursement-policy.md",
    summary:
      "Explains reimbursable travel costs, receipt requirements, and submission deadlines.",
    tags: ["finance", "expenses", "travel"],
  },
  {
    id: "security-and-password-standards",
    title: "Security and Password Standards",
    filename: "security-and-password-standards.md",
    summary:
      "Defines password manager use, MFA, phishing escalation, and remote security expectations.",
    tags: ["security", "passwords", "remote-work"],
  },
  {
    id: "travel-and-conference-policy",
    title: "Travel and Conference Policy",
    filename: "travel-and-conference-policy.md",
    summary:
      "Documents business-travel approvals, conference budgeting, and international travel guardrails.",
    tags: ["travel", "policy", "conferences"],
  },
];

export async function loadFixtureDocuments(): Promise<FixtureDocument[]> {
  return Promise.all(
    fixtureDefinitions.map(async (definition) => {
      const body = await readFile(
        path.join(fixtureDirectory, definition.filename),
        "utf8",
      );

      return {
        ...definition,
        body,
      };
    }),
  );
}
