<!--
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-11-02 15:29:29
 * @LastEditors: hiddenSharp429 z404878860@163.com
 * @LastEditTime: 2024-11-02 23:55:35
-->
<div align="center">
  
# 贡献指南

<div>
  <a href="README.MD">
    <img src="https://img.shields.io/badge/English-README-blue.svg?style=for-the-badge" height="22px" />
  </a>
  <a href="README_CN.MD">
    <img src="https://img.shields.io/badge/中文-说明文档-red.svg?style=for-the-badge" height="22px" />
  </a>
</div>

<div style="margin-top: 5px">
  <a href="CONTRIBUTING.MD">
    <img src="https://img.shields.io/badge/English-Contributing-green.svg?style=for-the-badge" height="22px" />
  </a>
  <a href="CONTRIBUTING_CN.MD">
    <img src="https://img.shields.io/badge/中文-贡献指南-yellow.svg?style=for-the-badge" height="22px" />
  </a>
</div>

---

</div>

## 1. 本地分支同步及创建分支

-  拉取develop分支上的最新代码
```bash
git pull origin develop
```

- 从develop分支创建新的分支
```bash
git checkout -b feature/xxxx
```

> 注意：分支命名规范
> - 新功能分支命名规范: `feature/功能描述`
> - 例如: feature/user-login, feature/payment-integration

- 切换到新分支
```bash
git checkout feature/xxxx
```

## 2. 开发过程

- 添加修改过的文件
```bash
git add .
```

- 提交代码
```bash
git commit -m "描述"
```

- 推送到远程分支
```bash
git push origin feature/xxxx
```

## 3. 在 GitHub 上创建 Pull Request

- 创建 Pull Request
- 将feature/xxxx 分支合并到 develop 分支
- 等待代码 Review
- 合并代码
- 合并后删除 feature/xxxx 分支
