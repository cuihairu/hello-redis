# 导航维护说明

VitePress 侧栏的唯一编辑源是 [`docs/.vitepress/sidebar.json`](.vitepress/sidebar.json)。该文件由 `docs/.vitepress/config.mts` 加载并作为站点导航真源；请直接在其中维护侧栏分组、标题和链接。

本文件是 mdBook 时代遗留的路径说明入口，不是第二份导航清单，也不参与 VitePress 页面构建。请勿在这里复制或手工维护侧栏条目；如需查阅当前目录，请以 `sidebar.json` 为准。站点配置排除了 `SUMMARY.md`，因此改动本说明不会改变页面 URL。
