# -*- coding: utf-8 -*-
"""博客 markdown 渲染自测：python tools/test-md.py

不需要安装 pytest，直接跑就行。有断言失败会以非零状态退出。
"""

import importlib.util
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

_HERE = os.path.dirname(os.path.abspath(__file__))
_BUILD = os.path.join(_HERE, "build-blog.py")

spec = importlib.util.spec_from_file_location("build_blog", _BUILD)
bb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bb)

FAILED = []


def check(name, got, want):
    if got == want:
        print("  ok   %s" % name)
    else:
        print("  FAIL %s\n       got:  %r\n       want: %r" % (name, got, want))
        FAILED.append(name)


print("== inline ==")
check("bold around code",
      bb._inline("**`blog/` x**"),
      "<strong><code>blog/</code> x</strong>")
check("plain bold", bb._inline("**粗体**"), "<strong>粗体</strong>")
check("italic", bb._inline("*斜体*"), "<em>斜体</em>")
check("inline code", bb._inline("a `b` c"), "a <code>b</code> c")
check("link", bb._inline("[x](https://a.com)"), '<a href="https://a.com">x</a>')
check("link with title",
      bb._inline('[x](https://a.com "t")'),
      '<a href="https://a.com" title="t">x</a>')
check("autolink",
      bb._inline("<https://a.com>"),
      '<a href="https://a.com">https://a.com</a>')
check("image", bb._inline("![alt](../p.png)"),
      '<img src="../p.png" alt="alt" />')

# 这些都不该被当成强调/链接
check("percent stays", bb._inline("正确率 95% 时"), "正确率 95% 时")
check("lone asterisk", bb._inline("5 * 3 元"), "5 * 3 元")
check("snake_case safe", bb._inline("a_b_c"), "a_b_c")
check("html is escaped", bb._inline("<script>x</script>"),
      "&lt;script&gt;x&lt;/script&gt;")

print("\n== blocks ==")
check("table",
      bb.markdown("| a | b |\n| --- | --- |\n| 1 | 2 |"),
      "<table>\n"
      "<thead><tr><th>a</th><th>b</th></tr></thead>\n"
      "<tbody>\n<tr><td>1</td><td>2</td></tr>\n</tbody></table>")
check("ul", bb.markdown("- a\n- b"), "<ul>\n<li>a</li>\n<li>b</li>\n</ul>")
check("ol", bb.markdown("1. a\n2. b"), "<ol>\n<li>a</li>\n<li>b</li>\n</ol>")
check("heading", bb.markdown("## 标题"), "<h2>标题</h2>")
check("hr", bb.markdown("---"), "<hr />")
check("blockquote", bb.markdown("> q"), "<blockquote>\n<p>q</p>\n</blockquote>")
check("fenced code",
      bb.markdown("```js\nlet a = 1;\n```"),
      '<pre><code class="language-js">let a = 1;</code></pre>')
check("code block is not a list",
      bb.markdown("```\n1. not a list\n```"),
      "<pre><code>1. not a list</code></pre>")
check("paragraph joins lines", bb.markdown("第一行\n第二行"),
      "<p>第一行 第二行</p>")

print("\n== excerpt ==")
check("excerpt strips markup",
      bb.plain_excerpt("## 标题\n\n这是 **正文** 和 `代码`。"),
      "标题 这是 正文 和 代码。")

print()
if FAILED:
    print("失败 %d 项：%s" % (len(FAILED), ", ".join(FAILED)))
    sys.exit(1)
print("全部通过")
