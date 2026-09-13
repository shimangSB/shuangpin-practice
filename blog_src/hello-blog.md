---
title: 这个博客是怎么搭起来的
date: 2026-01-01
tags: [博客, 建站]
summary: 双拼练习站加了个博客，没装任何框架，纯静态页面加一个 Python 转换脚本。说说为什么这么做，以及怎么发新文章。
---

## 为什么不用现成的博客框架

一开始考虑过 Jekyll 和 Hexo，最后都放弃了：

- **Jekyll** 是 GitHub Pages 内置的，但它会主动"处理"站点里的文件。双拼站是纯静态的，被 Jekyll 碰一下反而有搞坏的风险。
- **Hexo** 要装 Node、拉几百个依赖包。为了写几篇随笔去维护一个 node_modules，不划算。

所以这里的做法很简单：**一个 Python 脚本，把 markdown 转成 HTML**。零第三方依赖，用的是电脑上本来就有的 Python 标准库。

## 目录结构

| 路径 | 作用 |
| --- | --- |
| `blog_src/` | 我写文章的地方，只放 `.md` 文件 |
| `blog/` | 脚本自动生成的网页，**不要手动改** |
| `tools/build-blog.py` | 转换脚本 |
| `tools/publish-blog.bat` | 一键：生成 + 提交 + 推送 |

关键点是：**`blog/` 里的东西全是生成出来的**。想改样式就改脚本里的 `CSS_CONTENT`，想改文章就改 `blog_src/`，改完重新跑一次脚本。

## 怎么发一篇新文章

1. 在 `blog_src/` 里新建一个文件，比如 `my-post.md`
2. 文件开头加上这几行：

   ```markdown
   ---
   title: 文章的标题
   date: 2026-01-15
   tags: [标签一, 标签二]
   summary: 一句话摘要，会显示在文章列表里。
   ---
   ```

3. 下面正常写 markdown
4. 双击 `tools/publish-blog.bat`

过一两分钟，刷新 `https://shimangsb.github.io/shuangpin-practice/blog/` 就能看到了。

## 支持哪些 markdown 写法

够日常写作用了：

- 标题 `##`、**粗体**、*斜体*、`行内代码`
- [链接](https://example.com)和图片 `![说明](图片地址)`
- 有序列表、无序列表
- `>` 引用
- 三个反引号包的代码块
- `---` 分隔线
- 表格

图片建议放在 `blog/` 目录下，然后在文章里用 `../图片名.png` 引用。

## 草稿

front matter 里写 `draft: true`，这篇文章就只存在本地，不会被生成到 `blog/` 里，也就不会上线。想发布时删掉这行，或者改成 `false`。
