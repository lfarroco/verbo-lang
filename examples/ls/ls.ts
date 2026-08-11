// ls.ts — a small `ls` CLI implemented from the Verbo-refined natural-language
// spec in test/ls/ (see examples/ls/README.md for the spec→code mapping).
//
// Usage:
//   deno run -A ls.ts [-a] [-l] [-t] [-r] [-R] [path]
//
// Every behavior below is traceable to a sentence in the refined spec:
//   main.md / models/entry.md / models/options.md
//
// Exit codes: 0 on success, 1 on any error (spec: "the tool exits with status
// code 1 for all error conditions").
import { basename, join } from "https://deno.land/std@0.224.0/path/mod.ts";

export type SortKey = "name" | "modified" | "none";

export interface Entry {
  name: string;
  /** Path of the entry relative to the listed directory. */
  path: string;
  /** Symlinks are listed as files: isDirectory is false, never followed. */
  isDirectory: boolean;
  /** Bytes. Directories always report 0; symlinks report the link size. */
  size: number;
  /** Last modification time, displayed in the local system timezone. */
  modifiedAt: Date;
  /** True when the name starts with a dot. */
  hidden: boolean;
}

export interface Options {
  path: string;
  showHidden: boolean;
  longFormat: boolean;
  sortBy: SortKey;
  reverse: boolean;
  recursive: boolean;
}

export interface ParseResult {
  options: Options;
  error?: string;
}

/** Parse CLI args: `-a` hidden, `-l` long, `-t` sort by time, `-r` reverse,
 * `-R` recursive; first positional arg is the path. */
export function parseArgs(args: string[]): ParseResult {
  const options: Options = {
    path: ".",
    showHidden: false,
    longFormat: false,
    sortBy: "name",
    reverse: false,
    recursive: false,
  };
  const positionals: string[] = [];
  for (const arg of args) {
    switch (arg) {
      case "-a":
        options.showHidden = true;
        break;
      case "-l":
        options.longFormat = true;
        break;
      case "-t":
        options.sortBy = "modified";
        break;
      case "-r":
        options.reverse = true;
        break;
      case "-R":
        options.recursive = true;
        break;
      default:
        if (arg.startsWith("-") && arg.length > 1) {
          return { options, error: `ls: unknown option '${arg}'` };
        }
        positionals.push(arg);
    }
  }
  if (positionals.length > 0) options.path = positionals[0];
  return { options };
}

/** The special entries '.' and '..' are never listed, and entries starting
 * with a dot are hidden unless `-a` is given. */
function isHiddenName(name: string): boolean {
  return name.startsWith(".");
}

function buildEntry(
  fullPath: string,
  relative: string,
  d: Deno.DirEntry,
): Entry {
  // `Deno.DirEntry.isDirectory` is false for symlinks (readDir does not follow
  // them), so a symlink to a directory is listed as a file and never followed.
  const isDirectory = d.isDirectory;
  let size: number;
  let modifiedAt: Date;
  if (isDirectory) {
    size = 0; // "A directory always reports size 0, never a computed total."
    modifiedAt = Deno.lstatSync(fullPath).mtime ?? new Date(0);
  } else if (d.isSymlink) {
    // "For a symbolic link, the size of the link itself (not its target)."
    const st = Deno.lstatSync(fullPath);
    size = st.size;
    modifiedAt = st.mtime ?? new Date(0);
  } else {
    const st = Deno.lstatSync(fullPath);
    size = st.size;
    modifiedAt = st.mtime ?? new Date(0);
  }
  return {
    name: d.name,
    path: relative,
    isDirectory,
    size,
    modifiedAt,
    hidden: isHiddenName(d.name),
  };
}

/** Read the entries of one directory. Hidden entries are dropped unless
 * `-a`; '.' and '..' are always dropped. */
function collectDir(
  dirPath: string,
  rel: string,
  opts: Options,
): { entries: Entry[] } | { error: string } {
  let dirents: Deno.DirEntry[];
  try {
    dirents = [...Deno.readDirSync(dirPath)];
  } catch (err) {
    return {
      error: `ls: cannot open directory '${dirPath}': ${
        (err as Error).message
      }`,
    };
  }
  const entries: Entry[] = [];
  for (const d of dirents) {
    if (d.name === "." || d.name === "..") continue;
    if (isHiddenName(d.name) && !opts.showHidden) continue;
    entries.push(
      buildEntry(join(dirPath, d.name), rel ? `${rel}/${d.name}` : d.name, d),
    );
  }
  return { entries };
}

/** Case-sensitive byte ordering for name sort ("Entries are sorted by name
 * using case-sensitive ordering."). */
function compareNames(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Sort a single directory's listing.
 *  - name:     alphabetical, case-sensitive (default)
 *  - modified: last-modified descending; equal timestamps tie-break by name
 *  - none:     filesystem order as returned by the OS
 * `reverse` flips the final display order. */
export function sortEntries(
  entries: Entry[],
  key: SortKey,
  reverse: boolean,
): Entry[] {
  const sorted = [...entries];
  if (key === "modified") {
    sorted.sort(
      (a, b) =>
        b.modifiedAt.getTime() - a.modifiedAt.getTime() ||
        compareNames(a.name, b.name),
    );
  } else if (key === "name") {
    sorted.sort((a, b) => compareNames(a.name, b.name));
  }
  if (reverse) sorted.reverse();
  return sorted;
}

/** Long-format line: type character, size, "YYYY-MM-DD HH:MM" local time,
 * and the entry name (never the path). */
export function formatEntry(entry: Entry, longFormat: boolean): string {
  if (!longFormat) return entry.name;
  const typeChar = entry.isDirectory ? "d" : "f";
  const d = entry.modifiedAt;
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${
    pad(d.getDate())
  } ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${typeChar} ${entry.size} ${date} ${entry.name}`;
}

/** When the given path is a regular file, the tool lists that single file as
 * one entry — even when -R is given. Name = basename, path = provided path. */
function singleFileEntry(path: string): Entry {
  const st = Deno.lstatSync(path);
  return {
    name: basename(path),
    path,
    isDirectory: false,
    size: st.size,
    modifiedAt: st.mtime ?? new Date(0),
    hidden: isHiddenName(basename(path)),
  };
}

export interface ListingResult {
  stdout: string[];
  stderr: string[];
  exitCode: number;
}

/** Drive the full listing and return lines + error lines without touching
 * the console, so the same logic is testable. */
export function list(opts: Options): ListingResult {
  const stdout: string[] = [];
  const stderr: string[] = [];

  let st;
  try {
    st = Deno.lstatSync(opts.path);
  } catch (err) {
    return {
      stdout: [],
      stderr: [`ls: cannot access '${opts.path}': ${(err as Error).message}`],
      exitCode: 1,
    };
  }

  // A single file path is listed as one entry, even with -R.
  if (!st.isDirectory) {
    stdout.push(formatEntry(singleFileEntry(opts.path), opts.longFormat));
    return { stdout, stderr, exitCode: 0 };
  }

  if (!opts.recursive) {
    const res = collectDir(opts.path, "", opts);
    if ("error" in res) {
      // An error reading the top-level directory is fatal.
      return { stdout: [], stderr: [res.error], exitCode: 1 };
    }
    for (const e of sortEntries(res.entries, opts.sortBy, opts.reverse)) {
      stdout.push(formatEntry(e, opts.longFormat));
    }
    return { stdout, stderr, exitCode: 0 };
  }

  // Recursive: a header line per directory (its path), then its entries.
  const fatal = walk(opts.path, "", opts, stdout, stderr);
  return { stdout, stderr, exitCode: fatal ? 1 : 0 };
}

/** Recursive walk. Returns true when a fatal (top-level) error occurred.
 * Unreadable subdirectories print an error to stderr and continue. */
function walk(
  dirPath: string,
  rel: string,
  opts: Options,
  stdout: string[],
  stderr: string[],
): boolean {
  const res = collectDir(dirPath, rel, opts);
  if ("error" in res) {
    if (rel === "") return true; // fatal
    stderr.push(res.error);
    return false;
  }

  const header = rel === "" ? opts.path : rel;
  if (stdout.length > 0) stdout.push("");
  stdout.push(`${header}:`);
  const sorted = sortEntries(res.entries, opts.sortBy, opts.reverse);
  for (const e of sorted) stdout.push(formatEntry(e, opts.longFormat));

  let fatal = false;
  for (const e of sorted) {
    // Symlinked directories are never traversed (isDirectory is false).
    if (!e.isDirectory) continue;
    const subRel = rel === "" ? e.name : `${rel}/${e.name}`;
    if (walk(join(dirPath, e.name), subRel, opts, stdout, stderr)) {
      fatal = true;
    }
  }
  return fatal;
}

if (import.meta.main) {
  const { options, error } = parseArgs(Deno.args);
  if (error) {
    console.error(error);
    Deno.exit(1);
  }
  const result = list(options);
  for (const line of result.stdout) console.log(line);
  for (const line of result.stderr) console.error(line);
  Deno.exit(result.exitCode);
}
