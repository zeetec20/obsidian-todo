#!/usr/bin/env bun
import { parseArgs } from "util";
import { addVault, loadConfig, saveConfig, validateVault } from "./core/config.ts";
import {
  deleteTask,
  filterTasks,
  loadAllTasks,
} from "./core/repo.ts";
import { isStatus, type Filter } from "./core/types.ts";
import { THEME_NAMES } from "./core/theme.ts";
import { printTasks } from "./cli/print.ts";

const HELP = `otodo — Obsidian TODO browser

Usage:
  otodo                       Launch the TUI (asks for a vault on first run)
  otodo new                   Launch the TUI and open the new-task form
  otodo list [filters]        Print tasks to stdout (no TUI)
  otodo rm <id> [--yes]       Delete a task by id
  otodo vault <path>          Set the Obsidian vault directory
  otodo theme <name>          Set theme: ${THEME_NAMES.join(" | ")}
  otodo --help

List filters:
  --status <s>   backlog|todo|doing|review|done
  --tag <t>      tag name (without #)
  --category <c> category (folder) name
  --due <d>      YYYY-MM-DD | today | overdue
  --json         machine-readable output
`;

async function requireVault(): Promise<string> {
  const cfg = await loadConfig();
  const vault = cfg.lastVault ?? cfg.vaultPath;
  if (!vault) {
    process.stderr.write(
      "No vault set. Run `otodo vault <path>` or launch `otodo` to pick one.\n",
    );
    process.exit(1);
  }
  return vault;
}

async function launchTui(openNew = false): Promise<void> {
  const { runTui } = await import("./tui/app.tsx");
  await runTui({ openNew });
}

async function cmdList(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: {
      status: { type: "string" },
      tag: { type: "string" },
      category: { type: "string" },
      due: { type: "string" },
      json: { type: "boolean" },
    },
    allowPositionals: true,
  });

  if (values.status && !isStatus(values.status)) {
    process.stderr.write(`Invalid status: ${values.status}\n`);
    process.exit(1);
  }

  const vault = await requireVault();
  const all = await loadAllTasks(vault);
  const filter: Filter = {
    status: values.status as Filter["status"],
    tag: values.tag,
    category: values.category,
    due: values.due,
  };
  printTasks(filterTasks(all, filter), { json: values.json });
}

async function cmdRm(argv: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    options: { yes: { type: "boolean", short: "y" } },
    allowPositionals: true,
  });
  const id = positionals[0];
  if (!id) {
    process.stderr.write("Usage: otodo rm <id> [--yes]\n");
    process.exit(1);
  }
  const vault = await requireVault();
  const all = await loadAllTasks(vault);
  const task = all.find((t) => t.id === id || t.id === `#${id}`);
  if (!task) {
    process.stderr.write(`No task with id ${id}\n`);
    process.exit(1);
  }
  if (!values.yes) {
    const answer = prompt(`Delete ${task.id} "${task.name}"? [y/N]`);
    if (answer?.toLowerCase() !== "y") {
      process.stdout.write("Aborted.\n");
      return;
    }
  }
  await deleteTask(task);
  process.stdout.write(`Deleted ${task.id}\n`);
}

async function cmdVault(argv: string[]): Promise<void> {
  const path = argv[0];
  if (!path) {
    process.stderr.write("Usage: otodo vault <path>\n");
    process.exit(1);
  }
  const check = await validateVault(path);
  if (!check.ok) {
    process.stderr.write(`${check.reason}: ${path}\n`);
    process.exit(1);
  }
  const cfg = await loadConfig();
  const next = addVault(cfg, path);
  await saveConfig(next);
  process.stdout.write(`Vault set to ${next.lastVault}\n`);
}

async function cmdTheme(argv: string[]): Promise<void> {
  const name = argv[0];
  if (!name || !(THEME_NAMES as readonly string[]).includes(name)) {
    process.stderr.write(`Usage: otodo theme <${THEME_NAMES.join("|")}>\n`);
    process.exit(1);
  }
  const cfg = await loadConfig();
  await saveConfig({ ...cfg, theme: name });
  process.stdout.write(`Theme set to ${name}\n`);
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);

  switch (cmd) {
    case undefined:
      return launchTui(false);
    case "new":
      return launchTui(true);
    case "list":
      return cmdList(rest);
    case "rm":
      return cmdRm(rest);
    case "vault":
      return cmdVault(rest);
    case "theme":
      return cmdTheme(rest);
    case "help":
    case "--help":
    case "-h":
      process.stdout.write(HELP);
      return;
    default:
      process.stderr.write(`Unknown command: ${cmd}\n\n${HELP}`);
      process.exit(1);
  }
}

main();
