# ShowTheRate 项目备份策略

## 📋 备份概览

本项目采用多层次的备份策略，确保代码、数据和配置的安全性。

## 🏗️ 备份层次

### 1. 代码仓库备份（Git）
- **位置**: GitHub (https://github.com/jiankn/showtherate)
- **内容**: 完整的源代码、配置文件、文档
- **频率**: 每次代码提交自动备份
- **恢复**: `git clone` 或 `git pull`

### 2. 自动备份（GitHub Actions）
- **位置**: GitHub Releases
- **内容**: 完整的项目快照（代码+配置）
- **频率**: 每周一自动执行
- **触发**: 也可以手动触发

### 3. 数据库备份
- **位置**: `backups/database/`
- **内容**: Supabase 数据库的数据和结构
- **频率**: 按需执行
- **格式**: JSON 数据文件

### 4. 环境配置备份
- **位置**: `backups/env/`
- **内容**: 环境变量模板和配置清单
- **频率**: 每次环境变更时
- **安全**: 不包含敏感信息

## 🛠️ 备份工具

### 自动化脚本

#### `scripts/backup-project.sh`
完整项目备份脚本
```bash
# 完整备份
./scripts/backup-project.sh full

# 仅代码备份
./scripts/backup-project.sh code

# 仅数据库备份
./scripts/backup-project.sh db
```

#### `scripts/backup-database.js`
数据库专用备份脚本
```bash
node scripts/backup-database.js
```

#### `scripts/backup-env.sh`
环境配置备份脚本
```bash
./scripts/backup-env.sh
```

### GitHub Actions 自动备份

位于 `.github/workflows/backup.yml`，每周自动执行：
- 备份源代码和配置
- 创建压缩归档
- 上传到 GitHub Releases

## 📦 备份内容详解

### 代码备份包含：
- ✅ 源代码文件 (`src/`)
- ✅ 配置文件 (`*.json`, `*.js`, `*.md`)
- ✅ 文档 (`docs/`, `README.md`)
- ✅ 脚本 (`scripts/`)
- ✅ 数据库迁移 (`supabase/`)
- ❌ 依赖包 (`node_modules/`)
- ❌ 构建文件 (`.next/`)
- ❌ 敏感配置 (`.env*`)

### 数据库备份包含：
- ✅ 用户数据 (`profiles`, `comparisons`, `shares`)
- ✅ 业务数据 (`clients`, `tickets`, `entitlements`)
- ✅ 内容数据 (`blog_posts`)
- ❌ 审计日志 (大文件，影响备份效率)

## 🔄 恢复流程

### 代码恢复
```bash
# 使用恢复脚本
./scripts/restore-project.sh /path/to/backup.tar.gz

# 或手动恢复
tar -xzf backup.tar.gz
cp -r backup_content/* ./
npm install
```

### 数据库恢复
1. 创建新的 Supabase 项目
2. 运行迁移脚本：
   ```bash
   psql -h db-host -U postgres -d postgres -f supabase/schema.sql
   ```
3. 导入数据：
   ```bash
   node scripts/restore-database.js
   ```

### 环境配置恢复
1. 复制 `.env.example` 到 `.env.local`
2. 手动填写敏感信息：
   - Supabase URL 和密钥
   - Stripe 密钥
   - 其他第三方服务密钥

## 🔐 安全注意事项

### 敏感信息处理
- ❌ 不要提交 `.env*` 文件到 Git
- ❌ 不要在备份中包含真实密钥
- ✅ 使用环境变量模板 (`.env.example`)
- ✅ 定期轮换 API 密钥

### 访问控制
- 🔒 数据库备份文件不公开
- 🔒 GitHub 私有仓库
- 🔒 定期检查备份权限

## 📊 备份监控

### 检查清单
- [ ] Git 仓库推送正常
- [ ] GitHub Actions 运行成功
- [ ] 备份文件完整性
- [ ] 数据库连接正常
- [ ] 环境变量已更新

### 故障排除
- **备份失败**: 检查环境变量和网络连接
- **恢复失败**: 验证备份文件完整性
- **权限问题**: 检查 Supabase 和 GitHub 权限

## 📅 维护计划

- **每日**: 检查自动化备份状态
- **每周**: 验证备份文件完整性
- **每月**: 测试恢复流程
- **每季度**: 更新备份策略和脚本

## 🚨 紧急恢复

如遇紧急情况：

1. **立即停止服务**以防止数据污染
2. **从 GitHub 拉取最新代码**
3. **恢复数据库**到最新备份点
4. **验证环境配置**
5. **逐步重启服务**并监控状态

---

**最后更新**: 2026-01-14
**维护者**: ShowTheRate Team
