import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

import { gemini } from "./src/api/gemini.ts";
import { openai } from "./src/api/openai.ts";
import { anthropic } from "./src/api/anthropic.ts";
import { ollama } from "./src/api/ollama.ts";
import { deepseek } from "./src/api/deepseek.ts";

import { createDirIfNotExists, getEnv } from "./src/utils.ts";
import clarify from "./src/commands/clarify.ts";
import { runCheck as runPipelineCheck } from "./src/check/pipeline.ts";
import {
  parseClarifications,
  runInterview as runInteractiveInterview,
} from "./src/interview/engine.ts";
import { severityAtLeast } from "./src/interview/types.ts";
import type { Severity } from "./src/interview/types.ts";
import {
  formatRecheckReport,
  formatRemainingMessage,
  formatSeverityBreakdown,
  parseSeverity,
} from "./src/cli/messages.ts";

// --- Constants ---
const VERSION = "0.1.0";

const DEFAULT_MODELS: Record<string, string> = {
  gemini: "gemini-1.5-flash-latest",
  openai: "gpt-4o-mini",
  ollama: "codegemma",
  anthropic: "claude-3-haiku-20240307",
  deepseek: "deepseek-v4-flash",
};

const VALID_PROVIDERS = ["gemini", "openai", "ollama", "anthropic", "deepseek"];

type AiProviderType = "gemini" | "openai" | "ollama" | "anthropic" | "deepseek";
type AiProviderFn = (prompt: string) => Promise<string>;

// --- Helper Functions ---

function printHelp(): void {
  console.log(`Verbo v${VERSION}`);
  console.log("");
  console.log(
    "A specification engineering tool. Write data models in flavored Markdown,",
  );
  console.log(
    "validate them deterministically, and resolve ambiguities through AI-assisted interviews.",
  );
  console.log("");
  console.log("Usage: verbo <command> [OPTIONS...]");
  console.log("");
  console.log("Commands:");
  console.log(
    "  check      Extract specs, generate types, validate with deno check",
  );
  console.log("  clarify    Analyze specs for ambiguities using AI");
  console.log(
    "  interview  Resolve spec ambiguities interactively and write answers back to the spec files",
  );
  console.log("");
  console.log("Options:");
  console.log("  -h, --help              Display this help and exit");
  console.log("  -V, --version           Output version information and exit");
  console.log("  -v, --verbose           Enable verbose output");
  console.log(
    "  -d, --dir <path>        Source directory for Verbo files. Default: ./",
  );
  console.log("  -e, --envfile <path>    Path to .env file. Default: .env");
  console.log(
    `  -a, --aiprovider <name> AI provider (${
      VALID_PROVIDERS.join(", ")
    }). Default: ollama`,
  );
  console.log(
    "  -m, --model <name>      AI model to use. See provider for defaults.",
  );
  console.log(
    "  -r, --recheck           After interview, re-run clarify and report remaining ambiguities.",
  );
  console.log(
    "      --min-severity <sev> Only keep/ask questions at or above CRITICAL|HIGH|MEDIUM.",
  );
  console.log(
    "      --fail-on <sev>      Exit with status 1 when questions at or above this severity remain (CI).",
  );
}

function getProvider(
  providerName: AiProviderType,
  model: string,
  dotEnvFilePath: string,
): AiProviderFn {
  switch (providerName) {
    case "gemini":
      console.log(`Using Gemini with model: ${model}`);
      return gemini(getEnv(dotEnvFilePath, "GEMINI_KEY"), model);
    case "openai":
      console.log(`Using OpenAI with model: ${model}`);
      return openai(getEnv(dotEnvFilePath, "OPENAI_KEY"), model);
    case "anthropic":
      console.log(`Using Anthropic with model: ${model}`);
      return anthropic(getEnv(dotEnvFilePath, "ANTHROPIC_KEY"), model);
    case "deepseek":
      console.log(`Using DeepSeek with model: ${model}`);
      return deepseek(getEnv(dotEnvFilePath, "DEEPSEEK_KEY"), model);
    case "ollama":
      console.log(`Using Ollama with model: ${model}`);
      return ollama(model);
  }
}

// --- Command Handlers ---

async function runCheck(
  sourceDir: string,
  aiProvider: AiProviderFn,
): Promise<void> {
  const result = await runPipelineCheck({ sourceDir, aiProvider });
  if (result.ok) {
    console.log(
      `\n✅ Spec check passed after ${result.attempts} extraction attempt${
        result.attempts === 1 ? "" : "s"
      }.`,
    );
  }
}

async function runInterview(
  sourceDir: string,
  aiProvider: AiProviderFn,
  recheck: boolean,
  minSeverity?: Severity,
  failOn?: Severity,
): Promise<number> {
  createDirIfNotExists(`${sourceDir}/.verbo/clarifications`);
  const result = await runInteractiveInterview({
    sourceDir,
    aiProvider,
    minSeverity,
  });
  const touched = result.filesTouched.length;
  console.log(
    `\n✅ Interview complete: ${result.answered} answered, ${result.skipped} skipped, ${touched} file${
      touched === 1 ? "" : "s"
    } touched.`,
  );

  if (recheck) {
    // Re-clarify the same dir (DESIGN §9.3) and report what remains.
    console.log("\nRe-running clarify...");
    await clarify({ sourceDir, aiProvider });

    const clarificationsPath = join(sourceDir, "clarifications.json");
    let current: number;
    try {
      current = parseClarifications(
        Deno.readTextFileSync(clarificationsPath),
      ).length;
    } catch {
      console.log(
        "⚠️ Could not re-read clarifications.json — run `verbo clarify` manually to check remaining ambiguities.",
      );
      return 0;
    }

    if (current > 0) {
      console.log(formatRemainingMessage(current));
    } else {
      console.log("No remaining ambiguities — spec is clean ✨");
    }

    // (T8) Convergence report: trend + severity breakdown.
    const previous = result.decisions.length;
    if (current > 0) {
      console.log(formatRecheckReport(previous, current));
      const remaining = parseClarifications(
        Deno.readTextFileSync(clarificationsPath),
      );
      console.log(`Severity breakdown: ${formatSeverityBreakdown(remaining)}`);
    }

    // (T9) CI gate.
    if (failOn && current > 0) {
      const remaining = parseClarifications(
        Deno.readTextFileSync(clarificationsPath),
      );
      if (remaining.some((q) => severityAtLeast(q.severity, failOn))) {
        console.error(
          `❌ Fail-on ${failOn}: questions at or above this severity remain.`,
        );
        return 1;
      }
    }
  } else {
    console.log(
      "💡 Run `verbo clarify` again to check for remaining ambiguities.",
    );
  }
  return 0;
}

// --- Main Execution ---

export async function main(args: string[] = Deno.args): Promise<void> {
  // Treat the first positional argument as the command
  const command = args[0] && !args[0].startsWith("-") ? args[0] : "help";
  const rest = args[0] && !args[0].startsWith("-") ? args.slice(1) : args;

  const options = parseArgs(rest, {
    alias: {
      "help": "h",
      "version": "V",
      "verbose": "v",
      "dir": "d",
      "envfile": "e",
      "aiprovider": "a",
      "model": "m",
      "recheck": "r",
    },
    boolean: ["help", "verbose", "version", "recheck"],
    string: [
      "dir",
      "envfile",
      "aiprovider",
      "model",
      "min-severity",
      "fail-on",
    ],
    default: {
      dir: "./",
      envfile: ".env",
      aiprovider: "ollama",
    },
  });

  if (options.help || command === "help") {
    printHelp();
    return;
  }

  if (options.version) {
    console.log(VERSION);
    return;
  }

  const verbose = options.verbose;
  if (verbose) {
    console.log("Command:", command);
    console.log("Options:", options);
  }

  // --- Configuration ---
  const aiProviderName = options.aiprovider as AiProviderType;

  if (!VALID_PROVIDERS.includes(aiProviderName)) {
    console.error(
      `Error: Invalid AI provider "${aiProviderName}". Valid options are: ${
        VALID_PROVIDERS.join(", ")
      }`,
    );
    return;
  }

  const model = options.model || DEFAULT_MODELS[aiProviderName];
  const dotEnvFilePath = `${Deno.cwd()}/${options.envfile}`;
  const aiProvider = getProvider(aiProviderName, model, dotEnvFilePath);
  const sourceDir = options.dir;

  // --- Command Dispatch ---
  // Validate the new severity flags once so all commands share the check.
  const rawMinSeverity = parseSeverity(
    options["min-severity"] as string | undefined,
  );
  const rawFailOn = parseSeverity(options["fail-on"] as string | undefined);
  const minSeverity = rawMinSeverity ?? undefined;
  const failOn = rawFailOn ?? undefined;
  if (options["min-severity"] !== undefined && rawMinSeverity === null) {
    console.error(
      `Error: Invalid --min-severity "${
        options["min-severity"]
      }". Valid options are: CRITICAL, HIGH, MEDIUM`,
    );
    Deno.exit(1);
  }
  if (options["fail-on"] !== undefined && rawFailOn === null) {
    console.error(
      `Error: Invalid --fail-on "${
        options["fail-on"]
      }". Valid options are: CRITICAL, HIGH, MEDIUM`,
    );
    Deno.exit(1);
  }

  try {
    switch (command) {
      case "check":
        await runCheck(sourceDir, aiProvider);
        break;
      case "clarify": {
        const code = await clarify({
          sourceDir,
          aiProvider,
          minSeverity,
          failOn,
        });
        if (code !== 0) Deno.exit(code);
        break;
      }
      case "interview": {
        const code = await runInterview(
          sourceDir,
          aiProvider,
          options.recheck === true,
          minSeverity ?? undefined,
          failOn ?? undefined,
        );
        if (code !== 0) Deno.exit(code);
        break;
      }
      default:
        console.error(`Error: Unknown command "${command}".`);
        console.error("Available commands: check, clarify, interview");
        console.error("Run `verbo help` for usage information.");
    }
  } catch (error) {
    console.error(
      "An error occurred:",
      error instanceof Error ? error.message : String(error),
    );
    if (verbose) {
      console.error(error);
    }
  }
}

// Run main only when the script is executed directly
if (import.meta.main) {
  main(Deno.args);
}
