#!/bin/bash

# ShowTheRate 项目备份脚本
# 使用方法: ./scripts/backup-project.sh [full|code|db]

set -e

# 配置
PROJECT_NAME="showtherate"
BACKUP_ROOT="/tmp/${PROJECT_NAME}_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 创建备份目录
create_backup_dir() {
    log_info "创建备份目录: ${BACKUP_DIR}"
    mkdir -p "${BACKUP_DIR}"
}

# 备份代码和配置
backup_code() {
    log_info "备份代码和配置文件..."

    # 代码文件
    rsync -av --exclude='node_modules' \
               --exclude='.next' \
               --exclude='.git' \
               --exclude='*.log' \
               ./ "${BACKUP_DIR}/code/"

    # 环境变量模板（不包含敏感信息）
    cp .env.example "${BACKUP_DIR}/code/" 2>/dev/null || log_warn "未找到 .env.example 文件"

    log_info "代码备份完成: ${BACKUP_DIR}/code/"
}

# 备份数据库
backup_database() {
    log_info "备份数据库..."

    # 检查环境变量
    if [ -z "$SUPABASE_PROJECT_REF" ]; then
        log_error "请设置 SUPABASE_PROJECT_REF 环境变量"
        return 1
    fi

    # 使用 Supabase CLI 导出数据
    if command -v supabase &> /dev/null; then
        log_info "使用 Supabase CLI 导出数据库模式..."
        supabase db dump --db-url="postgresql://postgres:[YOUR_PASSWORD]@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres" \
                        --schema=public \
                        --schema=graphql_public \
                        --file="${BACKUP_DIR}/database/schema.sql"

        log_info "导出用户数据..."
        supabase db dump --db-url="postgresql://postgres:[YOUR_PASSWORD]@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres" \
                        --data-only \
                        --exclude-table=audit_log_entries \
                        --file="${BACKUP_DIR}/database/data.sql"
    else
        log_warn "未安装 Supabase CLI，请手动备份数据库"
        log_info "备份数据库模式文件..."
        cp supabase/schema.sql "${BACKUP_DIR}/database/" 2>/dev/null || true
        cp supabase/seed_*.sql "${BACKUP_DIR}/database/" 2>/dev/null || true
    fi

    log_info "数据库备份完成: ${BACKUP_DIR}/database/"
}

# 备份上传的资源文件
backup_assets() {
    log_info "备份上传的资源文件..."

    # 复制 public 目录中的上传文件
    rsync -av public/images/ "${BACKUP_DIR}/assets/images/" 2>/dev/null || log_warn "没有上传的图片"

    log_info "资源文件备份完成: ${BACKUP_DIR}/assets/"
}

# 创建备份清单
create_manifest() {
    log_info "创建备份清单..."

    cat > "${BACKUP_DIR}/MANIFEST.txt" << EOF
ShowTheRate 项目备份清单
备份时间: $(date)
备份类型: $1
备份位置: ${BACKUP_DIR}

包含内容:
EOF

    if [[ -d "${BACKUP_DIR}/code" ]]; then
        echo "- 源代码和配置文件" >> "${BACKUP_DIR}/MANIFEST.txt"
    fi

    if [[ -d "${BACKUP_DIR}/database" ]]; then
        echo "- 数据库模式和数据" >> "${BACKUP_DIR}/MANIFEST.txt"
    fi

    if [[ -d "${BACKUP_DIR}/assets" ]]; then
        echo "- 上传的资源文件" >> "${BACKUP_DIR}/MANIFEST.txt"
    fi

    echo "" >> "${BACKUP_DIR}/MANIFEST.txt"
    echo "恢复说明:" >> "${BACKUP_DIR}/MANIFEST.txt"
    echo "1. 代码恢复: 复制 code/ 目录内容到项目根目录" >> "${BACKUP_DIR}/MANIFEST.txt"
    echo "2. 数据库恢复: 运行 database/schema.sql 和 database/data.sql" >> "${BACKUP_DIR}/MANIFEST.txt"
    echo "3. 资源文件恢复: 复制 assets/ 目录内容到 public/" >> "${BACKUP_DIR}/MANIFEST.txt"
}

# 压缩备份
compress_backup() {
    log_info "压缩备份文件..."

    ARCHIVE_NAME="${PROJECT_NAME}_backup_${TIMESTAMP}.tar.gz"
    ARCHIVE_PATH="${BACKUP_ROOT}/${ARCHIVE_NAME}"

    cd "${BACKUP_ROOT}"
    tar -czf "${ARCHIVE_NAME}" "${TIMESTAMP}/"

    log_info "备份压缩完成: ${ARCHIVE_PATH}"
    echo "备份文件大小: $(du -sh "${ARCHIVE_PATH}" | cut -f1)"
}

# 主函数
main() {
    local backup_type=${1:-"full"}

    log_info "开始 ShowTheRate 项目备份 (${backup_type})"

    create_backup_dir

    case $backup_type in
        "code")
            backup_code
            ;;
        "db")
            mkdir -p "${BACKUP_DIR}/database"
            backup_database
            ;;
        "assets")
            mkdir -p "${BACKUP_DIR}/assets"
            backup_assets
            ;;
        "full")
            backup_code
            mkdir -p "${BACKUP_DIR}/database"
            backup_database
            mkdir -p "${BACKUP_DIR}/assets"
            backup_assets
            ;;
        *)
            log_error "无效的备份类型: $backup_type"
            log_info "可用类型: full, code, db, assets"
            exit 1
            ;;
    esac

    create_manifest "$backup_type"
    compress_backup

    log_info "备份完成!"
    log_info "备份文件: ${BACKUP_ROOT}/${PROJECT_NAME}_backup_${TIMESTAMP}.tar.gz"
    log_info "备份清单: ${BACKUP_DIR}/MANIFEST.txt"
}

# 检查参数并执行
main "$@"
