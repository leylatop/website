import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Welcome to LeylaTop',
  tagline: 'Dinosaurs are cool',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'facebook', // Usually your GitHub org/user name.
  projectName: 'docusaurus', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'], 
  },

  markdown: {
    format: 'md',
  },

  presets: [ 
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editLocalizedFiles: false, // 不显示编辑按钮
          include: ['📓 学习笔记/**', '🤦 Remind me.md'],
          // 排除非md文件
          exclude: ['**/*.pdf', '**/*.xmind', '**/*.jpg', '**/asset/**']
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editLocalizedFiles: false, // 不显示编辑按钮
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'ignore'
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          lastmod: 'date',
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
          createSitemapItems: async (params) => {
            const {defaultCreateSitemapItems, ...rest} = params;
            const items = await defaultCreateSitemapItems(rest);
            return items.filter((item) => !item.url.includes('/page/'));
          },
        },
        // docs: {
				// 	sidebarPath: require.resolve('./sidebars.js'),
				// 	sidebarCollapsible: true,
				// },
				// gtag: {
				// 	trackingID: 'GTM-P5GG5DH',
				// 	anonymizeIP: true,
				// },
				// theme: {
				// 	customCss: [
				// 		require.resolve('./src/theme/styles.css'),
				// 		require.resolve('@infinum/docusaurus-theme/dist/style.css'),
				// 	],
				// },
				// blog: {
				// 	blogTitle: 'Tutorials and articles about Eightshift development kit',
				// 	blogDescription:
				// 		'Tutorials and articles about Eightshift development kit',
				// 	blogSidebarTitle: 'Latest posts',
				// 	showReadingTime: true,
				// 	postsPerPage: 9,
				// },
				// sitemap: {
				// 	changefreq: 'weekly',
				// 	priority: 0.5,
				// },
      } satisfies Preset.Options,
    ],
  ],

  // themes: [['docusaurus-theme-awesome', {hello: 'world'}]],

  plugins: [
    // [
    //   '@docusaurus/plugin-content-docs',
    //   {
    //     id: 'forms',
    //     path: 'forms',
    //     routeBasePath: 'forms',
    //     sidebarPath: './sidebars-forms.ts',
    //   },
    // ],
    // [
    //   '@docusaurus/plugin-content-docs',
    //   {
    //     id: 'about',
    //     path: 'about',
    //     routeBasePath: 'about',
    //     sidebarPath: './sidebars-about.ts',
    //   },
    // ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'LeylaTop',
      logo: {
        alt: 'My Site Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
					to: 'docs/🤦 Remind me',
					activeBasePath: 'docs',
					label: '📓 笔记',
					position: 'right',
				},
        // {
				// 	to: 'forms/welcome',
				// 	activeBasePath: 'forms',
				// 	label: 'Forms',
				// 	position: 'right',
				// },
        {
					// to: 'markdown-page', // 可以是tsx，也可以是mdx
          to: 'tool',
					activeBasePath: 'tool',
					label: '🔨 工具',
					position: 'right',
				},
				// {
				// 	to: '/components/welcome',
				// 	activeBasePath: 'components',
				// 	label: 'Components',
				// 	position: 'right',
				// },
				// {
				// 	to: 'forms/welcome',
				// 	activeBasePath: 'forms',
				// 	label: 'Forms',
				// 	position: 'right',
				// },
        {
					to: '/blog',
					activeBasePath: 'blog',
					label: '📝 博客',
					position: 'right',
				},
        {
					// to: 'markdown-page', // 可以是tsx，也可以是mdx
          to: 'about',
					activeBasePath: 'about',
					label: '🧙 关于',
					position: 'right',
				},
				// {
				// 	to: '/components/welcome',
				// 	activeBasePath: 'components',
				// 	label: 'Components',
				// 	position: 'right',
				// },
				// {
				// 	to: '/playground/',
				// 	activeBasePath: 'playground',
				// 	label: 'Playground',
				// 	position: 'right',
				// },
				
				// {
				// 	to: '/showcase',
				// 	activeBasePath: 'showcase',
				// 	label: 'Showcase',
				// 	position: 'right',
				// },
        // {
        //   type: 'docSidebar',
        //   sidebarId: 'tutorialSidebar',
        //   position: 'left',
        //   label: 'Tutorial',
        // },
        // {to: '/blog', label: 'Blog', position: 'left'},
        // {
        //   href: 'https://github.com/facebook/docusaurus',
        //   label: 'GitHub',
        //   position: 'right',
        // },
      ],
    },
    footer: {
      style: 'dark',
      // links: [
      //   {
      //     title: 'Docs',
      //     items: [
      //       {
      //         label: 'Tutorial',
      //         to: '/docs/intro',
      //       },
      //     ],
      //   },
      //   {
      //     title: 'Community',
      //     items: [
      //       {
      //         label: 'Stack Overflow',
      //         href: 'https://stackoverflow.com/questions/tagged/docusaurus',
      //       },
      //       {
      //         label: 'Discord',
      //         href: 'https://discordapp.com/invite/docusaurus',
      //       },
      //       {
      //         label: 'Twitter',
      //         href: 'https://twitter.com/docusaurus',
      //       },
      //     ],
      //   },
      //   {
      //     title: 'More',
      //     items: [
      //       {
      //         label: 'Blog',
      //         to: '/blog',
      //       },
      //       {
      //         label: 'GitHub',
      //         href: 'https://github.com/facebook/docusaurus',
      //       },
      //     ],
      //   },
      // ],
      // copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
      links: [
        // {
        //   label: 'Stack Overflow',
        //   href: 'https://stackoverflow.com/questions/tagged/docusaurus',
        // },
        {
          html: `
              <div class="record-container">
                <a href="https://beian.mps.gov.cn/#/query/webSearch?code=41010502006082" rel="noreferrer" target="_blank">豫公网安备41010502006082</a>
                <a href="https://beian.miit.gov.cn" target="_blank">豫ICP备2024078050号-1</a>
              </div>
            `,
        },
      ]
    },
    docs: {
			sidebar: {
				autoCollapseCategories: false, // 是否自动折叠侧边栏
        hideable: true, // 是否可以隐藏侧边栏
			},
		},
    prism: { // 代码块主题
      theme: prismThemes.gruvboxMaterialDark,
      darkTheme: prismThemes.dracula,
      // additionalLanguages: ['php', 'scss', 'css'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
