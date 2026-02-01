import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Hey Bible",
  tagline: "Explore scripture with AI-powered insights",
  favicon: "img/favicon.png",

  // Set the production url of your site here
  url: "https://docs.heybible.app",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "Hey-Bible",
  projectName: "hey-bible-docs",

  onBrokenLinks: "throw",

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/Hey-Bible/hey-bible-docs/tree/main/",
          routeBasePath: "/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      "@scalar/docusaurus",
      {
        id: "api",
        route: "/api",
        label: "",
        configuration: {
          spec: {
            url: "https://raw.githubusercontent.com/Hey-Bible/hey-bible-client/main/openapi.yaml",
          },
          hideModels: true,
        },
      },
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/og-image.png",
    navbar: {
      title: "Hey Bible",
      logo: {
        alt: "Hey Bible Logo",
        src: "img/logo.png",
      },
      items: [
        {
          href: "https://heybible.app",
          label: "Login",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Home",
              to: "/",
            },
          ],
        },
        {
          title: "Follow Us",
          items: [
            {
              label: "Instagram",
              href: "https://www.instagram.com/heybible",
            },
            {
              label: "X",
              href: "https://x.com/heybible",
            },
          ],
        },
        {
          title: "About",
          items: [
            {
              label: "Privacy",
              href: "https://heybible.org/privacy",
            },
            {
              label: "Terms",
              href: "https://heybible.org/terms",
            },
            {
              label: "Support",
              href: "https://app.youform.com/forms/o1pfzrgp",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Working Dev's Hero LLC. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
