// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

import { themes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Muscle Mommies Docs',
  tagline: 'The official documentation for the Muscle Mommies project',
  favicon: 'img/favicon.ico',

  url: 'https://tino-ryan.github.io', // Your website URL
  baseUrl: '/Muscle-mommies/',        // Path to your repo (if deployed to GitHub Pages)
  organizationName: 'tino-ryan',      // GitHub org/user name
  projectName: 'Muscle-mommies',      // GitHub repo name

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/', // Docs are served at root URL
          editUrl: 'https://github.com/tino-ryan/Muscle-mommies/edit/main/',
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/tino-ryan/Muscle-mommies/edit/main/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Muscle Mommies',
        logo: {
          alt: 'Muscle Mommies Logo',
          src: 'img/logo.svg', // Change to your logo if you have one
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            to: '/blog',
            label: 'Blog',
            position: 'left',
          },
          {
            href: 'https://github.com/tino-ryan/Muscle-mommies',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Introduction',
                to: '/',
              },
              {
                label: 'Tech Stack',
                to: '/tech-stack',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/tino-ryan/Muscle-mommies',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Muscle Mommies.`,
      },
      prism: {
        theme: themes.github,
        darkTheme: themes.dracula,
      },
    }),
};

export default config;
