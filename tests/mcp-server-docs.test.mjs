// Checks that the MCP server page documents every tool and setting the server
// has, and that its examples use public-domain translations.
//
// Run with `npm test`.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const page = readFileSync(
  new URL("../docs/developers/mcp-server.mdx", import.meta.url),
  "utf8",
);

const TOOLS = [
  "search_verses",
  "get_bibles",
  "get_books",
  "get_favorites",
  "get_notes",
  "get_images",
  "generate_image",
  "get_chats",
  "get_tags",
];

test("every MCP tool has its own section", () => {
  for (const tool of TOOLS) {
    assert.match(page, new RegExp(`^### ${tool}$`, "m"), `missing section for ${tool}`);
  }
});

test("generate_image warns that it spends credits and explains a 402", () => {
  const section = page.slice(page.indexOf("### generate_image"), page.indexOf("### get_chats"));
  assert.match(section, /spends credits/);
  assert.match(section, /402/);
});

test("both environment variables are documented", () => {
  assert.match(page, /`HEY_BIBLE_API_KEY`/);
  assert.match(page, /`HEY_BIBLE_API_URL`/);
});

test("example prompts use public-domain translations, not the ESV", () => {
  const prompts = page.slice(page.indexOf("## Example Prompts"), page.indexOf("## Troubleshooting"));
  assert.doesNotMatch(prompts, /\bESV\b/);
  assert.match(prompts, /picture of Isaiah 40:31 in the WEB/);
});
