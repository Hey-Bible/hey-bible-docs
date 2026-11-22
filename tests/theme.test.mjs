// Checks on the Storybook Sticker theme: that text keeps a readable contrast
// in both colour modes, that the brand assets and the app screenshots are in
// place, and that nothing of the old gold and sky-blue look is left behind.
//
// Run with `npm test`.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

import { codeThemeDay, codeThemeNight } from "../src/code-themes.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");
const css = read("src/css/custom.css");

// WCAG AA for normal-size text
const AA = 4.5;

// ── Colour helpers ──

function rgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  assert.match(full, /^[0-9a-f]{6}$/i, `not a hex colour: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

function luminance(hex) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ── Reading tokens out of custom.css ──

/** The custom properties declared in the first rule with this exact selector. */
function declarations(selector) {
  const start = css.indexOf(`\n${selector} {`);
  assert.notEqual(start, -1, `no "${selector}" rule in custom.css`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  const found = {};
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g))
    found[name] = value.trim();
  return found;
}

const day = declarations(":root");
const night = { ...day, ...declarations("html[data-theme='dark']") };

/** A token's value in a mode, following var() references to a hex colour. */
function token(mode, name) {
  let value = mode[name];
  assert.ok(value, `${name} is not declared`);
  for (let hops = 0; hops < 10; hops++) {
    const ref = value.match(/^var\((--[\w-]+)\)$/);
    if (!ref) break;
    value = mode[ref[1]];
    assert.ok(value, `${name} points at ${ref[1]}, which is not declared`);
  }
  // A transparent surface shows the page
  if (value === "transparent") return token(mode, "--ifm-background-color");
  return value;
}

// Text token on surface token. Every pair must pass in both modes.
const pairs = [
  ["body text", "--ifm-color-content", "--ifm-background-color"],
  ["secondary text", "--ifm-color-content-secondary", "--ifm-background-color"],
  ["headings", "--ifm-heading-color", "--ifm-background-color"],
  ["links", "--ifm-link-color", "--ifm-background-color"],
  ["links on a card", "--ifm-link-color", "--sticker-surface-card"],
  ["link hover", "--ifm-link-hover-color", "--ifm-background-color"],
  ["navbar links", "--ifm-navbar-link-color", "--ifm-navbar-background-color"],
  ["navbar button", "--sticker-button-contrast", "--sticker-button"],
  ["sidebar links", "--ifm-menu-color", "--ifm-background-color"],
  ["sidebar open category", "--ifm-menu-color-active", "--ifm-background-color"],
  ["sidebar current page", "--sticker-active-contrast", "--sticker-active"],
  ["table of contents", "--ifm-toc-link-color", "--ifm-background-color"],
  ["inline code", "--ifm-color-content", "--ifm-code-background"],
  ["table head", "--ifm-table-head-color", "--ifm-table-head-background"],
  ["footer text", "--ifm-footer-color", "--ifm-footer-background-color"],
  ["footer titles", "--ifm-footer-title-color", "--ifm-footer-background-color"],
  ["footer links", "--ifm-footer-link-color", "--ifm-footer-background-color"],
  ["footer link hover", "--ifm-footer-link-hover-color", "--ifm-footer-background-color"],
  ["button labels", "--ifm-color-content-inverse", "--ifm-color-primary"],
  ["button labels on hover", "--ifm-color-content-inverse", "--ifm-color-primary-dark"],
  ["API reference secondary text", "--ifm-color-content-secondary", "--sticker-surface-card"],
];

// The API reference (Scalar) colours code and HTTP methods with these, on the
// page and on its cards
for (const hue of ["green", "red", "yellow", "blue", "orange", "purple"]) {
  pairs.push(
    [`API reference ${hue}`, `--sticker-syntax-${hue}`, "--ifm-background-color"],
    [`API reference ${hue} on a card`, `--sticker-syntax-${hue}`, "--sticker-surface-card"]
  );
}

for (const [modeName, mode] of [["day", day], ["night", night]]) {
  for (const [label, text, surface] of pairs) {
    test(`${modeName}: ${label} pass AA`, () => {
      const ratio = contrast(token(mode, text), token(mode, surface));
      assert.ok(
        ratio >= AA,
        `${text} on ${surface} is ${ratio.toFixed(2)}:1, below ${AA}:1`
      );
    });
  }
}

const admonitions = ["note", "tip", "info", "warning", "danger"];

test("day: admonitions put ink on a pastel tint that passes AA", () => {
  for (const kind of admonitions) {
    const ratio = contrast(token(day, "--sticker-ink"), token(day, `--sticker-alert-${kind}`));
    assert.ok(ratio >= AA, `${kind} is ${ratio.toFixed(2)}:1`);
  }
});

test("night: admonition text and tinted headings pass AA on the night card", () => {
  const card = token(night, "--sticker-surface-card");
  assert.ok(contrast(token(night, "--sticker-cream"), card) >= AA);
  for (const kind of admonitions) {
    const ratio = contrast(token(night, `--sticker-alert-${kind}`), card);
    assert.ok(ratio >= AA, `${kind} heading is ${ratio.toFixed(2)}:1`);
  }
});

test("white text only sits on terracotta or darker", () => {
  assert.equal(token(day, "--sticker-button").toLowerCase(), "#a4573e");
  assert.equal(token(day, "--sticker-button-contrast").toLowerCase(), "#ffffff");
  // The button's hover fill is the next darker step
  assert.ok(contrast("#ffffff", token(day, "--ifm-color-primary-dark")) >= AA);
});

test("the primary colours are the brand's", () => {
  assert.equal(token(day, "--ifm-color-primary").toLowerCase(), "#a4573e");
  assert.equal(token(night, "--ifm-color-primary").toLowerCase(), "#e8b3a0");
  assert.equal(token(day, "--ifm-background-color").toLowerCase(), "#f3e8d6");
  assert.equal(token(night, "--ifm-background-color").toLowerCase(), "#232b3d");
});

// ── Code blocks ──

for (const [modeName, theme] of [["day", codeThemeDay], ["night", codeThemeNight]]) {
  test(`${modeName}: every code colour passes AA on the code block background`, () => {
    const background = theme.plain.backgroundColor;
    // Later styles win, as they do when the theme is applied
    const colours = new Map([["plain", theme.plain.color]]);
    for (const { types, style } of theme.styles)
      if (style.color) for (const type of types) colours.set(type, style.color);
    for (const [type, colour] of colours) {
      const ratio = contrast(colour, background);
      assert.ok(
        ratio >= AA,
        `${type} (${colour}) on ${background} is ${ratio.toFixed(2)}:1`
      );
    }
  });
}

// ── Brand assets ──

test("fonts are self-hosted and declared", () => {
  for (const file of ["fredoka-variable-latin.woff2", "nunito-variable-latin.woff2"]) {
    assert.ok(existsSync(join(root, "static/fonts", file)), `${file} is missing`);
    assert.ok(css.includes(`url('/fonts/${file}')`), `${file} has no @font-face`);
  }
  assert.doesNotMatch(css, /url\(['"]?https?:/, "a font or image is hotlinked");
});

test("the navbar logo is an SVG mark for each colour mode", () => {
  const config = read("docusaurus.config.ts");
  assert.match(config, /src: "img\/logo\.svg"/);
  assert.match(config, /srcDark: "img\/logo-dark\.svg"/);
  assert.match(read("static/img/logo.svg"), /fill="#43302A"/);
  assert.match(read("static/img/logo-dark.svg"), /fill="#F3E8D6"/);
});

test("the social preview image is 1200×630 and has a source", () => {
  const png = readFileSync(join(root, "static/img/og-image.png"));
  assert.equal(png.toString("latin1", 1, 4), "PNG");
  // Width and height are the first two fields of the IHDR chunk
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.ok(existsSync(join(root, "brand/og-image.html")));
});

test("the share image and the banner show the shepherd with the flock", () => {
  for (const file of ["brand/og-image.html", "brand/banner.html", "brand/banner-dark.html"]) {
    const page = read(file);
    assert.match(page, /clipPath id="shepherd-robe"/, `${file}: no shepherd in the meadow`);
    // The old meadow had the sun where the shepherd now stands
    assert.doesNotMatch(page, /circle cx="160" cy="68" r="20"/, `${file}: still the old meadow`);
    const sprigs = page.match(/class="bit leaf"/g)?.length ?? 0;
    const stars = (page.match(/class="bit"/g)?.length ?? 0);
    assert.ok(sprigs >= 2, `${file}: expected a couple of sprigs in the gaps`);
    assert.ok(stars >= 4, `${file}: expected a few stars in the gaps`);
    assert.ok(sprigs + stars <= 12, `${file}: the scatter should stay thin`);
  }
});

test("the banner is 1500×500", () => {
  const png = readFileSync(join(root, "docs/img/banner.png"));
  assert.equal(png.toString("latin1", 1, 4), "PNG");
  assert.equal(png.readUInt32BE(16), 1500);
  assert.equal(png.readUInt32BE(20), 500);
});

test("dark mode has its own banner: the shepherd leads with a lamp that lights the path", () => {
  const png = readFileSync(join(root, "docs/img/banner-dark.png"));
  assert.equal(png.toString("latin1", 1, 4), "PNG");
  assert.equal(png.readUInt32BE(16), 1500);
  assert.equal(png.readUInt32BE(20), 500);

  const night = read("brand/banner-dark.html");
  // A night card in the docs' dark colours, not the day card
  const dark = css.slice(css.indexOf("html[data-theme='dark'] {"));
  const card = dark.match(/--sticker-surface-card:\s*(#[0-9a-f]{6})/i)[1];
  const edge = dark.match(/--sticker-edge:\s*(#[0-9a-f]{6})/i)[1];
  assert.ok(night.includes(`background: ${card};`), "the card is not the night card colour");
  assert.ok(night.includes(`border: 9px solid ${edge};`), "the card edge is not the night edge");
  assert.doesNotMatch(night, /#CFE3EC/i, "the day sky is still in the night banner");
  assert.doesNotMatch(night, /fill="#43302A"/i, "the mark is still ink on a dark card");
  // The lamp's light: rings round the flame, and the path drawn bright inside them
  assert.match(night, /<clipPath id="night-lit">/);
  assert.match(night, /clip-path="url\(#night-lit\)"/, "nothing is lit by the lamp");
  // The flock is behind the shepherd: each sheep starts further left than he does
  const starts = [...night.matchAll(/<g transform="translate\((\d+(?:\.\d+)?) /g)].map((m) => Number(m[1]));
  const shepherd = Number(night.match(/translate\((\d+(?:\.\d+)?) [\d.]+\) scale\([\d.]+\) rotate/)[1]);
  const flock = starts.filter((x) => x < shepherd);
  assert.ok(flock.length >= 2, "the flock should follow behind the shepherd");
});

test("the introduction shows the day banner in light mode and the night banner in dark mode", () => {
  const intro = read("docs/index.mdx");
  assert.match(intro, /!\[Hey Bible Banner\]\(img\/banner\.png#light-mode-only\)/);
  assert.match(intro, /!\[Hey Bible Banner\]\(img\/banner-dark\.png#dark-mode-only\)/);
  // Plain Markdown, so the page still reads cleanly in llms-full.txt
  assert.doesNotMatch(intro, /ThemedImage/);

  // Each mode hides the other mode's picture, and nothing else
  const rule = css.match(/([^{}]*)\{\s*display:\s*none;\s*\}/g).find((r) => r.includes("-mode-only"));
  assert.ok(rule, "no rule hides the other mode's picture");
  const selectors = rule.slice(rule.lastIndexOf("*/") + 2, rule.indexOf("{")).split(",").map((s) => s.trim());
  assert.deepEqual(selectors.sort(), [
    "html[data-theme='dark'] img[src$='#light-mode-only']",
    "html[data-theme='light'] img[src$='#dark-mode-only']",
  ]);
});

// ── App screenshots on the introduction ──

const screenshots = ["1-login", "2-search", "3-favorites", "4-verse", "5-images", "6-image"];

/** The [r, g, b] of the pixel in the middle of a PNG's top row. */
function topMiddlePixel(png) {
  const width = png.readUInt32BE(16);
  assert.equal(png[24], 8, "expected 8 bits per channel");
  const channels = { 2: 3, 6: 4 }[png[25]];
  assert.ok(channels, "expected an RGB or RGBA picture");
  assert.equal(png[28], 0, "expected a picture that is not interlaced");
  // The pixels are the IDAT chunks joined and inflated; each chunk is length, name, data, checksum
  const data = [];
  for (let at = 8; at < png.length; at += png.readUInt32BE(at) + 12)
    if (png.toString("latin1", at + 4, at + 8) === "IDAT")
      data.push(png.subarray(at + 8, at + 8 + png.readUInt32BE(at)));
  const row = inflateSync(Buffer.concat(data)).subarray(0, 1 + width * channels);
  // Undo the row's filter. Nothing is above the top row, so only the pixel to the left counts.
  const filter = row[0];
  const line = row.subarray(1);
  for (let i = channels; i < line.length; i++) {
    const left = line[i - channels];
    if (filter === 1 || filter === 4) line[i] = (line[i] + left) & 255;
    else if (filter === 3) line[i] = (line[i] + (left >> 1)) & 255;
  }
  const middle = Math.floor(width / 2) * channels;
  return [...line.subarray(middle, middle + 3)];
}

test("the introduction shows six phone screenshots of the app, each 1284×2778", () => {
  const intro = read("docs/index.mdx");
  for (const name of screenshots) {
    const path = `docs/img/screenshots/${name}.png`;
    assert.ok(existsSync(join(root, path)), `${path} is missing`);
    const png = readFileSync(join(root, path));
    assert.equal(png.toString("latin1", 1, 4), "PNG", `${path} is not a PNG`);
    // 428×926 points on a phone that draws three pixels to the point
    assert.equal(png.readUInt32BE(16), 1284, `${path}: width`);
    assert.equal(png.readUInt32BE(20), 2778, `${path}: height`);
    assert.ok(
      intro.includes(`require('./img/screenshots/${name}.png')`),
      `the introduction does not show ${name}.png`,
    );
  }
  // Every picture the introduction asks for is one of the six, and the folder holds nothing else
  const shown = [...intro.matchAll(/img\/screenshots\/([\w-]+)\.png/g)].map((m) => m[1]);
  assert.deepEqual(shown, screenshots);
  assert.deepEqual(readdirSync(join(root, "docs/img/screenshots")).sort(), screenshots.map((n) => `${n}.png`));
});

test("the screenshots show the app's warm parchment, not the old sky blue", () => {
  for (const name of screenshots) {
    const [r, g, b] = topMiddlePixel(readFileSync(join(root, `docs/img/screenshots/${name}.png`)));
    // The app's page is parchment (about #F3E8D6); the old one was a pale blue (#E8F6FA)
    assert.ok(r > g && g > b && r - b >= 15, `${name}.png: the top of the screen is rgb(${r}, ${g}, ${b})`);
  }
});

// ── Leftovers of the old look ──

test("no colour of the old gold and sky-blue theme is left", () => {
  const old = [
    /#8b6914/i,
    /#d4a93a/i,
    /#1a2833/i,
    /#242526/i,
    /#7fcdeb/i,
    /rgba?\(\s*127,\s*205,\s*235/i,
  ];
  const textFile = /\.(css|ts|tsx|js|mjs|json|md|mdx|svg|html|sh)$/;
  const files = ["docusaurus.config.ts", "sidebars.ts"];
  const walk = (dir) => {
    for (const name of readdirSync(join(root, dir))) {
      const path = join(dir, name);
      if (statSync(join(root, path)).isDirectory()) walk(path);
      else if (textFile.test(name)) files.push(path);
    }
  };
  ["src", "static", "docs", "brand"].forEach(walk);
  for (const file of files)
    for (const colour of old)
      assert.doesNotMatch(read(file), colour, `${file} still uses ${colour}`);
});
