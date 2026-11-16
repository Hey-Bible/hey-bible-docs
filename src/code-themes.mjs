// Code block themes for the Storybook Sticker look (see src/css/custom.css).
//
// Both start from the Gruvbox Material themes, whose warm tones suit the
// palette, and take their background from it. tests/theme.test.mjs checks that
// every colour keeps a readable contrast on that background.
import { themes } from "prism-react-renderer";

/** @typedef {import("prism-react-renderer").PrismTheme} PrismTheme */

/**
 * Day: the pale card colour behind the code. The theme's faintest colours are
 * darkened so comments, operators, built-ins and function names stay readable
 * on it.
 * @type {PrismTheme}
 */
export const codeThemeDay = {
  ...themes.gruvboxMaterialLight,
  plain: {
    ...themes.gruvboxMaterialLight.plain,
    backgroundColor: "#FBF4E6",
  },
  styles: [
    ...themes.gruvboxMaterialLight.styles,
    {
      types: ["comment", "prolog", "cdata", "operator", "inserted"],
      style: { color: "#78675E" },
    },
    {
      types: [
        "imports",
        "class-name",
        "maybe-class-name",
        "constant",
        "doctype",
        "builtin",
      ],
      style: { color: "#8F5D0A" },
    },
    {
      types: ["function", "attr-name", "char", "url"],
      style: { color: "#676B1B" },
    },
  ],
};

/**
 * Night: a shade darker than the night page, so the block reads as a well and
 * every colour in the theme keeps its contrast.
 * @type {PrismTheme}
 */
export const codeThemeNight = {
  ...themes.gruvboxMaterialDark,
  plain: {
    ...themes.gruvboxMaterialDark.plain,
    backgroundColor: "#1F2636",
  },
};
