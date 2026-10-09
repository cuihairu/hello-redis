import { defineConfig } from 'vitepress'
import sidebar from './sidebar.json'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: 'Hello Redis',
  description: 'Redis 知识手册——数据类型、Lua 脚本、持久化与高可用、源码分析与使用场景',
  base: '/hello-redis/',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    // 品牌资产空位：favicon.svg 到位后启用
    // ['link', { rel: 'icon', type: 'image/svg+xml', href: '/hello-redis/favicon.svg' }]
  ],

  // mdbook 遗留的目录文件保留在仓库作映射底稿，不作为页面构建
  srcExclude: ['**/SUMMARY.md'],

  ignoreDeadLinks: true,

  themeConfig: {
    // 品牌资产空位：logo.svg 到位后启用
    // logo: '/logo.svg',
    siteTitle: 'Hello Redis',

    nav: [
      { text: '首页', link: '/' },
      { text: '基础知识', link: '/basics/README' },
      { text: '脚本功能', link: '/scripts/README' },
      { text: '进阶功能', link: '/advanced/README' },
      { text: '开发与集成', link: '/development/README' },
      { text: '源码分析', link: '/source-code-analysis/README' },
      { text: '使用场景', link: '/use-cases/README' },
      { text: '知识点', link: '/knowledge' }
    ],

    // 由 mdbook SUMMARY.md 结构映射而来（vitepress-migration/parse_summary.py），
    // 7 个部分 + 未入目录散页归入「附录 · 未入目录」
    sidebar: sidebar as never,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/cuihairu/hello-redis' }
    ],

    footer: {
      message: 'Hello Redis',
      copyright: '© 2025 cuihairu'
    },

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
  },

  markdown: {
    lineNumbers: false
  }
})
