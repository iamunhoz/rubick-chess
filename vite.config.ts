import { defineConfig } from "vite";
import { execSync } from "node:child_process";

function resolveGitCommit(): string {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

const buildVersion = `${resolveGitCommit()}-${new Date().toISOString()}`;

export default defineConfig({
  define: {
    __BUILD_VERSION__: JSON.stringify(buildVersion),
  },
});
