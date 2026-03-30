import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const cwd = process.cwd();
const initialEnvKeys = new Set(Object.keys(process.env));
const nodeEnv = process.env.NODE_ENV ?? "development";

function getEnvFilesForMode(mode) {
  if (mode === "test") {
    return [".env.example", ".env.test", ".env.test.local"];
  }

  return [".env.example", ".env.local"];
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function loadEnvFile(filename) {
  const fullPath = path.join(cwd, filename);

  if (!fs.existsSync(fullPath)) {
    return;
  }

  /** Non-empty entries in `.env*.local` override inherited vars (e.g. empty `MAPTILER_API_KEY=` from the IDE). */
  const isLocalEnvFile = filename.endsWith(".env.local") || filename.endsWith(".env.test.local");

  const content = fs.readFileSync(fullPath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = stripQuotes(line.slice(separatorIndex + 1).trim());

    if (isLocalEnvFile && value !== "") {
      process.env[key] = value;
      continue;
    }

    if (!initialEnvKeys.has(key) || !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function applyLocalPostgresDefaults() {
  const localUsername = os.userInfo().username;

  for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
    const value = process.env[key];

    if (!value) {
      continue;
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(value);
    } catch {
      continue;
    }

    const isLocalPostgres =
      parsedUrl.protocol === "postgresql:" &&
      (parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1");

    if (!isLocalPostgres || parsedUrl.username) {
      continue;
    }

    parsedUrl.username = localUsername;
    process.env[key] = parsedUrl.toString();
  }
}

if (fs.existsSync(path.join(cwd, ".env"))) {
  console.warn(
    'Ignoring legacy ".env". Use ".env.local" for local development and ".env.test.local" for tests.',
  );
}

for (const filename of getEnvFilesForMode(nodeEnv)) {
  loadEnvFile(filename);
}

applyLocalPostgresDefaults();

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Missing command for run-with-env.");
  process.exit(1);
}

/** Prefer `npx` so `prisma` / `tsx` resolve from `node_modules` when `.bin` is not on PATH. */
let spawnCommand = command;
let spawnArgs = args;

if (command === "prisma") {
  spawnCommand = "npx";
  spawnArgs = ["prisma", ...args];
} else if (command === "tsx") {
  spawnCommand = "npx";
  spawnArgs = ["tsx", ...args];
}

const child = spawn(spawnCommand, spawnArgs, {
  cwd,
  env: process.env,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
