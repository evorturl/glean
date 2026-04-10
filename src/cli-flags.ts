export type ParsedArgs = {
  _: string[];
  flags: Record<string, string | boolean>;
};

export function parseArgs(argv: string[]): ParsedArgs {
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

export function readStringFlag(
  parsed: ParsedArgs,
  key: string | string[],
): string | undefined {
  const keys = Array.isArray(key) ? key : [key];

  for (const candidate of keys) {
    const value = parsed.flags[candidate];

    if (typeof value === "string") {
      return value;
    }
  }

  return undefined;
}

export function readBooleanFlag(
  parsed: ParsedArgs,
  key: string | string[],
): boolean | undefined {
  const keys = Array.isArray(key) ? key : [key];

  for (const candidate of keys) {
    const value = parsed.flags[candidate];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      return value !== "false";
    }
  }

  return undefined;
}

export function readNumberFlag(
  parsed: ParsedArgs,
  key: string | string[],
): number | undefined {
  const value = readStringFlag(parsed, key);

  if (!value) {
    return undefined;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    const label = Array.isArray(key) ? key[0] : key;
    throw new Error(`Invalid numeric value for --${label}: ${value}`);
  }

  return number;
}
