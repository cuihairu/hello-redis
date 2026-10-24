import { defineConfig } from 'vitepress'
import sidebarEn from './sidebar.en.json'
import sidebarZh from './sidebar.zh.json'

// English (root) nav — section hubs only, so the top bar stays readable.
const navEn = [
  { text: 'Home', link: '/' },
  { text: 'Basics', link: '/basics/README' },
  { text: 'Scripting', link: '/scripts/README' },
  { text: 'Advanced', link: '/advanced/README' },
  { text: 'Development', link: '/development/README' },
  { text: 'Source Code', link: '/source-code-analysis/README' },
  { text: 'Use Cases', link: '/use-cases/README' },
  { text: 'Knowledge', link: '/knowledge' }
]

// 简体中文 nav — same shape, links routed under /zh/.
const navZh = [
  { text: '首页', link: '/zh/' },
  { text: '基础知识', link: '/zh/basics/README' },
  { text: '脚本功能', link: '/zh/scripts/README' },
  { text: '进阶功能', link: '/zh/advanced/README' },
  { text: '开发与集成', link: '/zh/development/README' },
  { text: '源码分析', link: '/zh/source-code-analysis/README' },
  { text: '使用场景', link: '/zh/use-cases/README' },
  { text: '知识点', link: '/zh/knowledge' }
]

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/hello-redis/',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/hello-redis/favicon.svg' }]
  ],

  // mdbook 遗留的目录文件保留在仓库作映射底稿，不作为页面构建
  srcExclude: ['**/SUMMARY.md'],

  ignoreDeadLinks: false,

  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      title: 'Hello Redis',
      description: 'A Redis developer notebook — data structures, Lua scripting, persistence and high availability, source code analysis, and real-world use cases.',
      themeConfig: {
        nav: navEn,
        sidebar: sidebarEn as never
      }
    },

    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      title: 'Hello Redis',
      description: 'Redis 知识手册——数据类型、Lua 脚本、持久化与高可用、源码分析与使用场景',
      themeConfig: {
        nav: navZh,
        sidebar: sidebarZh as never,

        search: {
          provider: 'local',
          options: {
            translations: {
              button: { buttonText: '搜索文档', buttonAriaLabel: '搜索' },
              modal: {
                noResultsText: '没有找到结果',
                resetButtonTitle: '清除查询条件',
                footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
              }
            }
          }
        },

        outline: {
          label: '页面导航',
          level: [2, 3]
        },

        docFooter: {
          prev: '上一篇',
          next: '下一篇'
        },

        lastUpdated: {
          text: '最后更新'
        },

        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '外观',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式'
      }
    }
  },

  themeConfig: {
    siteTitle: 'Hello Redis',
    logo: '/logo.svg',

    search: {
      provider: 'local'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/cuihairu/hello-redis' }
    ],

    footer: {
      message: 'Hello Redis',
      copyright: '© 2025 cuihairu'
    }
  },

  markdown: {
    lineNumbers: false
  }
})
