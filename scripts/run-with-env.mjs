import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const cwd = process.cwd();
const envFiles = [".env.example", ".env", ".env.local"];
const initialEnvKeys = new Set(Object.keys(process.env));

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

    if (!initialEnvKeys.has(key) || !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

for (const filename of envFiles) {
  loadEnvFile(filename);
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Missing command for run-with-env.");
  process.exit(1);
}

const child = spawn(command, args, {
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
