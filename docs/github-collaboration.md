# GitHub 结对协作与提交清单

项目名称为“校园失物招领”，协作仓库为 [cht-hyp/campus-lost-and-found](https://github.com/cht-hyp/campus-lost-and-found)，主分支为 `main`。仓库地址使用英文名称，README 与仓库描述保留中文项目名。本次保存现有代码及提交历史，成员后续通过各自账号提交真实改动。

## 另一位成员的实际操作

1. 使用自己的 GitHub 账号打开项目仓库，点击 Fork。
2. Clone 自己的 fork，将原项目添加为 upstream。
3. 从最新主分支创建功能分支，实际阅读、修改或补充一个有意义的功能、测试或文档。
4. 本地运行 `npm test`，用 Chrome 打开 `index.html` 走查。
5. 以自己的 Git 身份提交，push 到自己的 fork，发起 PR。
6. 原仓库成员查看差异、运行测试、交流问题后再合并，并保存实际截图。

```powershell
git clone <自己fork仓库的URL>
cd campus-lost-and-found
git remote add upstream https://github.com/cht-hyp/campus-lost-and-found.git
git switch -c review/my-contribution
# 实际进行修改，然后测试
npm test
git add <实际修改的文件>
git commit -m "test: add regression case for a real finding"
git push -u origin review/my-contribution
```

以上命令中的占位符须替换为自己的真实信息。不要共用一个账号假扮两人、伪造 commit 时间或为了凑数量提交没有意义的改动。

## 提交博客前

- 填写两位成员博客链接、本次博客链接、GitHub 仓库地址。
- 两人分别补录真实 PSP 实际耗时，解释超时或返工原因。
- 补充真实分工完成情况、试用反馈及互评；当前分工是计划，不能自动当作实际完成证明。
- 保存 GitHub Commits / 实际 PR 的截图，替换博客中明确标注的待补内容。
- 从 GitHub 重新下载 ZIP，解压后在 Chrome 打开入口，确认无遗漏素材。
- 在 2026-10-10 23:59 前填写班级结对表、项目地址并提交博客；建议 20:00 前准备完成。
