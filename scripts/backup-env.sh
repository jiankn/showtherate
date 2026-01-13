#!/bin/bash

# 环境变量备份脚本
# 安全地备份环境变量配置（不包含敏感信息）

set -e

BACKUP_DIR="./backups/env"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/env_backup_${TIMESTAMP}.txt"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo "环境变量配置备份 - $(date)" > "$BACKUP_FILE"
echo "=================================" >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"

# 备份环境变量模板（安全的）
if [ -f ".env.example" ]; then
    echo "环境变量模板 (.env.example):" >> "$BACKUP_FILE"
    echo "-----------------------------" >> "$BACKUP_FILE"
    cat .env.example >> "$BACKUP_FILE"
    echo "" >> "$BACKUP_FILE"
fi

# 备份重要的配置文件
echo "配置文件清单:" >> "$BACKUP_FILE"
echo "-------------" >> "$BACKUP_FILE"

files_to_backup=(
    "package.json"
    "next.config.mjs"
    "jsconfig.json"
    "tsconfig.json"
    "vercel.json"
    ".gitignore"
    "eslint.config.mjs"
)

for file in "${files_to_backup[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file" >> "$BACKUP_FILE"
    else
        echo "✗ $file (不存在)" >> "$BACKUP_FILE"
    fi
done

echo "" >> "$BACKUP_FILE"
echo "数据库迁移文件:" >> "$BACKUP_FILE"
echo "---------------" >> "$BACKUP_FILE"

if [ -d "supabase" ]; then
    find supabase -name "*.sql" -type f | sort >> "$BACKUP_FILE"
fi

echo "" >> "$BACKUP_FILE"
echo "重要提醒:" >> "$BACKUP_FILE"
echo "--------" >> "$BACKUP_FILE"
echo "1. 此备份不包含敏感的环境变量值" >> "$BACKUP_FILE"
echo "2. 恢复时需要手动设置实际的环境变量" >> "$BACKUP_FILE"
echo "3. 数据库连接信息需要从 Supabase 控制台重新获取" >> "$BACKUP_FILE"
echo "4. Stripe 密钥需要从 Stripe 控制台重新获取" >> "$BACKUP_FILE"

echo "环境变量配置已备份到: $BACKUP_FILE"
