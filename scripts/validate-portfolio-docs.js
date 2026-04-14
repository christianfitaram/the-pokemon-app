#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");

const REQUIRED_FILES = [
  "README.md",
  "docs/architecture.md",
  "docs/pr-narrative-guide.md",
  ".github/pull_request_template.md",
  "docs/media/README.md",
  "docs/media/home-search-desktop.png",
  "docs/media/home-search-mobile.png",
  "docs/media/details-card-desktop.png",
  "docs/media/details-card-mobile.png",
  "docs/media/chat-roleplay-desktop.png",
  "docs/media/chat-roleplay-mobile.png",
  "docs/media/team-builder-desktop.png",
  "docs/media/team-builder-mobile.png",
  "docs/media/health-readiness-desktop.png",
  "docs/media/health-readiness-mobile.png",
  "docs/media/search-to-chat-flow.gif",
];

const MARKDOWN_ROOTS = [
  "README.md",
  "docs",
  ".github",
];

const IGNORE_DIRS = new Set(["node_modules", ".git", ".next", "coverage"]);

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT_DIR, relPath));
}

function collectMarkdownFiles(entryPath, files) {
  const absolutePath = path.join(ROOT_DIR, entryPath);
  if (!fs.existsSync(absolutePath)) {
    return;
  }

  const stats = fs.statSync(absolutePath);
  if (stats.isFile()) {
    if (absolutePath.endsWith(".md")) {
      files.push(absolutePath);
    }
    return;
  }

  if (!stats.isDirectory()) {
    return;
  }

  const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) {
      continue;
    }

    const relativeChild = path.join(entryPath, entry.name);
    if (entry.isDirectory()) {
      collectMarkdownFiles(relativeChild, files);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path.join(ROOT_DIR, relativeChild));
    }
  }
}

function extractLinks(markdown) {
  const links = [];
  const pattern = /\[[^\]]*]\(([^)]+)\)/g;
  let match = null;
  while ((match = pattern.exec(markdown)) !== null) {
    links.push(match[1].trim());
  }
  return links;
}

function normalizeLinkTarget(link) {
  let target = link.trim();
  if (target.startsWith("<") && target.endsWith(">")) {
    target = target.slice(1, -1).trim();
  }

  return target
    .replace(/^['"]|['"]$/g, "")
    .split("#")[0]
    .split("?")[0];
}

function isExternalLink(link) {
  const value = link.toLowerCase();
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("data:")
  );
}

function run() {
  const missingRequired = REQUIRED_FILES.filter((relPath) => !fileExists(relPath));
  if (missingRequired.length > 0) {
    console.error("Missing required portfolio artifacts:");
    for (const relPath of missingRequired) {
      console.error(`- ${relPath}`);
    }
    process.exit(1);
  }

  const markdownFiles = [];
  for (const root of MARKDOWN_ROOTS) {
    collectMarkdownFiles(root, markdownFiles);
  }

  const brokenLinks = [];
  for (const filePath of markdownFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const links = extractLinks(content);
    for (const rawLink of links) {
      if (!rawLink || rawLink.startsWith("#") || isExternalLink(rawLink)) {
        continue;
      }

      const cleaned = normalizeLinkTarget(rawLink);
      if (!cleaned) {
        continue;
      }

      const resolvedPath = cleaned.startsWith("/")
        ? path.join(ROOT_DIR, cleaned.replace(/^\/+/, ""))
        : path.resolve(path.dirname(filePath), cleaned);

      if (!fs.existsSync(resolvedPath)) {
        brokenLinks.push({
          file: path.relative(ROOT_DIR, filePath),
          link: rawLink,
          resolved: path.relative(ROOT_DIR, resolvedPath),
        });
      }
    }
  }

  if (brokenLinks.length > 0) {
    console.error("Broken internal Markdown links detected:");
    for (const item of brokenLinks) {
      console.error(`- ${item.file}: ${item.link} -> ${item.resolved}`);
    }
    process.exit(1);
  }

  console.log("Portfolio documentation checks passed.");
  console.log(`Validated required files: ${REQUIRED_FILES.length}`);
  console.log(`Validated markdown files: ${markdownFiles.length}`);
}

run();
