#!/bin/bash

# ShowTheRate 项目恢复脚本
# 使用方法: ./scripts/restore-project.sh <backup_archive.tar.gz>

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 显示使用说明
show_usage() {
    echo "ShowTheRate 项目恢复脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 <backup_archive.tar.gz>"
    echo ""
    echo "示例:"
    echo "  $0 /path/to/showtherate_backup_20241201.tar.gz"
    echo ""
    echo "恢复流程:"
    echo "  1. 解压备份文件"
    echo "  2. 恢复源代码和配置"
    echo "  3. 恢复数据库（可选）"
    echo "  4. 恢复环境变量"
    echo "  5. 重新安装依赖"
}

# 检查参数
check_args() {
    if [ $# -ne 1 ]; then
        show_usage
        exit 1
    fi

    BACKUP_ARCHIVE="$1"

    if [ ! -f "$BACKUP_ARCHIVE" ]; then
        log_error "备份文件不存在: $BACKUP_ARCHIVE"
        exit 1
    fi
}

# 解压备份文件
extract_backup() {
    log_step "解压备份文件..."

    TEMP_DIR=$(mktemp -d)
    log_info "临时目录: $TEMP_DIR"

    if [[ "$BACKUP_ARCHIVE" == *.tar.gz ]]; then
        tar -xzf "$BACKUP_ARCHIVE" -C "$TEMP_DIR"
    elif [[ "$BACKUP_ARCHIVE" == *.zip ]]; then
        unzip "$BACKUP_ARCHIVE" -d "$TEMP_DIR"
    else
        log_error "不支持的备份文件格式"
        exit 1
    fi

    log_info "备份文件已解压到: $TEMP_DIR"
    echo "$TEMP_DIR"
}

# 恢复源代码
restore_code() {
    local backup_dir="$1"

    log_step "恢复源代码和配置文件..."

    # 查找代码目录
    local code_dir=""
    if [ -d "$backup_dir/code" ]; then
        code_dir="$backup_dir/code"
    elif [ -d "$backup_dir" ]; then
        # 可能是直接在根目录
        code_dir="$backup_dir"
    fi

    if [ -z "$code_dir" ]; then
        log_error "未找到代码目录"
        return 1
    fi

    # 恢复文件（排除一些不应覆盖的文件）
    rsync -av \
          --exclude='.env*' \
          --exclude='node_modules' \
          --exclude='.next' \
          --exclude='.git' \
          "$code_dir/" "$PROJECT_ROOT/"

    log_info "源代码恢复完成"
}

# 恢复环境变量
restore_env() {
    local backup_dir="$1"

    log_step "恢复环境变量配置..."

    if [ -f "$backup_dir/code/.env.example" ]; then
        cp "$backup_dir/code/.env.example" "$PROJECT_ROOT/"
        log_info "环境变量模板已恢复"
        log_warn "请手动配置 .env.local 文件中的敏感信息"
    else
        log_warn "未找到环境变量模板，请参考 docs/ENVIRONMENT_SETUP.md"
    fi
}

# 恢复数据库
restore_database() {
    local backup_dir="$1"

    log_step "恢复数据库..."

    if [ ! -d "$backup_dir/database" ]; then
        log_warn "未找到数据库备份，跳过数据库恢复"
        return 0
    fi

    log_info "发现数据库备份文件:"

    # 显示可用的数据库文件
    find "$backup_dir/database" -name "*.sql" -o -name "*.json" | while read -r file; do
        echo "  - $(basename "$file")"
    done

    echo ""
    log_warn "数据库恢复需要手动执行，请按以下步骤操作:"
    echo "  1. 确保 Supabase 项目已创建"
    echo "  2. 运行数据库迁移:"
    echo "     psql -h your-db-host -U postgres -d postgres -f $backup_dir/database/schema.sql"
    echo "  3. 导入数据:"
    echo "     psql -h your-db-host -U postgres -d postgres -f $backup_dir/database/data.sql"
    echo "  4. 或者使用 Supabase CLI 导入 JSON 数据"
}

# 重新安装依赖
reinstall_deps() {
    log_step "重新安装项目依赖..."

    cd "$PROJECT_ROOT"

    if [ -f "package-lock.json" ]; then
        log_info "检测到 npm 项目，使用 npm install"
        npm install
    elif [ -f "pnpm-lock.yaml" ]; then
        log_info "检测到 pnpm 项目，使用 pnpm install"
        pnpm install
    elif [ -f "yarn.lock" ]; then
        log_info "检测到 yarn 项目，使用 yarn install"
        yarn install
    else
        log_warn "未检测到锁文件，请手动安装依赖"
    fi
}

# 清理临时文件
cleanup() {
    local temp_dir="$1"

    log_step "清理临时文件..."

    if [ -d "$temp_dir" ]; then
        rm -rf "$temp_dir"
        log_info "临时文件已清理"
    fi
}

# 主函数
main() {
    check_args "$@"

    log_info "开始 ShowTheRate 项目恢复..."
    log_info "备份文件: $BACKUP_ARCHIVE"

    # 解压备份
    local temp_dir
    temp_dir=$(extract_backup)

    # 恢复各个部分
    restore_code "$temp_dir"
    restore_env "$temp_dir"
    restore_database "$temp_dir"

    # 清理临时文件
    cleanup "$temp_dir"

    # 重新安装依赖
    reinstall_deps

    log_info "项目恢复完成！"
    echo ""
    log_warn "后续步骤:"
    echo "  1. 配置环境变量 (.env.local)"
    echo "  2. 如需要，恢复数据库数据"
    echo "  3. 运行 'npm run dev' 启动开发服务器"
    echo "  4. 测试各项功能是否正常"
}

# 执行恢复
main "$@"
