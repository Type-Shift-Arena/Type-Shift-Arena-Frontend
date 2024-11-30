<!--
 * @Author: hiddenSharp429 z404878860@163.com
 * @Date: 2024-11-02 15:29:29
 * @LastEditors: hiddenSharp429 z404878860@163.com
 * @LastEditTime: 2024-11-02 23:55:27
-->
<div align="center">
  
# Contributing Guide

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

## 1. Local Branch Synchronization and Creation

- Pull the latest code from the develop branch
```bash
git pull origin develop
```

- Create a new branch from develop
```bash
git checkout -b feature/xxxx
```

> Note: Branch naming conventions
> - New feature branch naming convention: `feature/feature-description`
> - Example: feature/user-login, feature/payment-integration

- Switch to the new branch
```bash
git checkout feature/xxxx
```

## 2. Development Process

- Add modified files
```bash
git add .
```

- Commit code
```bash
git commit -m "description"
```

- Push to remote branch
```bash
git push origin feature/xxxx
```

## 3. Create Pull Request on GitHub

- Create Pull Request
- Merge feature/xxxx branch into develop branch
- Wait for code review
- Merge code
- Delete feature/xxxx branch after merging 