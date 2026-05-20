import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const children = new Set();

function readDotEnv() {
  const file = path.join(rootDir, ".env");
  if (!fs.existsSync(file)) return {};

  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return env;
      const index = trimmed.indexOf("=");
      if (index === -1) return env;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      env[key] = value;
      return env;
    }, {});
}

const fileEnv = readDotEnv();
const childEnv = { ...process.env, ...fileEnv };
const apiPort = childEnv.PORT || "8787";
const apiUrl = (childEnv.VITE_API_URL || `http://localhost:${apiPort}`).replace(/\/$/, "");
const localApiPattern = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i;

function pipeOutput(child, label) {
  child.stdout?.on("data", (chunk) => process.stdout.write(`[${label}] ${chunk}`));
  child.stderr?.on("data", (chunk) => process.stderr.write(`[${label}] ${chunk}`));
}

function run(label, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: rootDir,
    env: childEnv,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });

  children.add(child);
  pipeOutput(child, label);

  child.on("exit", (code, signal) => {
    children.delete(child);
    if (signal) return;
    if (code && code !== 0) {
      console.error(`[dev] ${label} exited with code ${code}.`);
      shutdown(code);
    }
  });

  return child;
}

function runNpmScript(label, script) {
  if (process.platform === "win32") {
    return run(label, "cmd.exe", ["/d", "/s", "/c", `npm run ${script}`]);
  }
  return run(label, "npm", ["run", script]);
}

async function apiIsHealthy() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1_500);
    const response = await fetch(`${apiUrl}/api/health`, { signal: controller.signal });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForApi() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await apiIsHealthy()) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

function shutdown(code = 0) {
  for (const child of children) child.kill();
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

if (await apiIsHealthy()) {
  console.log(`[dev] Reusing OmniPoll API at ${apiUrl}`);
} else if (localApiPattern.test(apiUrl)) {
  console.log(`[dev] Starting OmniPoll API at ${apiUrl}`);
  run("api", "node", ["server/index.mjs"]);
  const ready = await waitForApi();
  if (!ready) {
    console.error(`[dev] API did not become healthy at ${apiUrl}.`);
    shutdown(1);
  }
} else {
  console.warn(`[dev] API at ${apiUrl} is not reachable. Check VITE_API_URL before signing in or creating polls.`);
}

runNpmScript("web", "dev:client");
