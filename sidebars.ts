import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'index',
    'how-to-use-the-app',
    {
      type: 'category',
      label: 'Developers',
      collapsed: false,
      items: [
        'developers/generating-api-keys',
        'developers/nodejs-client',
        'developers/mcp-server',
        {
          type: 'link',
          label: 'API Reference',
          href: '/api',
        },
      ],
    },
  ],
};

export default sidebars;
