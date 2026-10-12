import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vendor = join(root, "vendor");

const repos = [
  {
    url: "https://github.com/isaac545454/frontend-events.git",
    dir: join(vendor, "frontend-events"),
    marker: "dist/index.js",
  },
  {
    url: "https://github.com/isaac545454/ds-nucleo-web-components.git",
    dir: join(vendor, "ds-nucleo-web-components"),
    marker: "dist/styles.css",
  },
];

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
}

mkdirSync(vendor, { recursive: true });

for (const repo of repos) {
  if (!existsSync(join(repo.dir, "package.json"))) {
    console.log(`clonando ${repo.url}`);
    run("git", ["clone", "--depth", "1", repo.url, repo.dir], root);
  }

  if (existsSync(join(repo.dir, repo.marker))) {
    console.log(`${repo.dir} já está compilado`);
    continue;
  }

  console.log(`compilando ${repo.dir}`);
  run("pnpm", ["--ignore-workspace", "install", "--frozen-lockfile"], repo.dir);
  run("pnpm", ["--ignore-workspace", "run", "build"], repo.dir);

  if (!existsSync(join(repo.dir, repo.marker))) {
    throw new Error(`Build não gerou ${repo.marker} em ${repo.dir}`);
  }
}
