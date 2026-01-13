#!/usr/bin/env node

/**
 * ShowTheRate 数据库备份脚本
 * 备份 Supabase 数据库数据和结构
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 配置
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'database');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 从环境变量读取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 缺少必要的环境变量:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function backupTable(tableName, fileName) {
    console.log(`📦 备份表: ${tableName}`);

    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(`❌ 备份 ${tableName} 失败:`, error.message);
            return false;
        }

        const backupData = {
            table: tableName,
            timestamp: new Date().toISOString(),
            recordCount: data.length,
            data: data
        };

        const filePath = path.join(BACKUP_DIR, fileName);
        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

        console.log(`✅ ${tableName}: ${data.length} 条记录已备份`);
        return true;

    } catch (error) {
        console.error(`❌ 备份 ${tableName} 时发生错误:`, error.message);
        return false;
    }
}

async function createBackupManifest() {
    const manifest = {
        project: 'ShowTheRate',
        timestamp: new Date().toISOString(),
        backupId: TIMESTAMP,
        database: {
            url: supabaseUrl.replace(/https?:\/\//, '').split('.')[0], // 脱敏处理
            tables: []
        }
    };

    // 读取备份的文件来构建清单
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));

    for (const file of files) {
        try {
            const filePath = path.join(BACKUP_DIR, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            manifest.database.tables.push({
                name: content.table,
                recordCount: content.recordCount,
                file: file
            });
        } catch (error) {
            console.warn(`⚠️  无法读取 ${file}:`, error.message);
        }
    }

    const manifestPath = path.join(BACKUP_DIR, `backup_manifest_${TIMESTAMP}.json`);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`📋 备份清单已创建: ${manifestPath}`);
}

async function main() {
    console.log('🚀 开始数据库备份...');
    console.log(`📁 备份目录: ${BACKUP_DIR}`);

    // 要备份的表列表（排除审计日志等大表）
    const tablesToBackup = [
        { table: 'profiles', file: `profiles_${TIMESTAMP}.json` },
        { table: 'comparisons', file: `comparisons_${TIMESTAMP}.json` },
        { table: 'shares', file: `shares_${TIMESTAMP}.json` },
        { table: 'clients', file: `clients_${TIMESTAMP}.json` },
        { table: 'tickets', file: `tickets_${TIMESTAMP}.json` },
        { table: 'entitlements', file: `entitlements_${TIMESTAMP}.json` },
        { table: 'blog_posts', file: `blog_posts_${TIMESTAMP}.json` },
        { table: 'user_avatars', file: `user_avatars_${TIMESTAMP}.json` }
    ];

    let successCount = 0;
    let totalCount = tablesToBackup.length;

    for (const { table, file } of tablesToBackup) {
        if (await backupTable(table, file)) {
            successCount++;
        }
    }

    // 创建备份清单
    await createBackupManifest();

    console.log(`\n🎉 备份完成!`);
    console.log(`📊 成功备份 ${successCount}/${totalCount} 个表`);
    console.log(`📦 备份文件位置: ${BACKUP_DIR}`);

    // 计算备份文件大小
    const files = fs.readdirSync(BACKUP_DIR);
    let totalSize = 0;
    for (const file of files) {
        const filePath = path.join(BACKUP_DIR, file);
        totalSize += fs.statSync(filePath).size;
    }

    console.log(`💾 备份总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    if (successCount < totalCount) {
        console.log('\n⚠️  部分表备份失败，请检查数据库连接和权限');
        process.exit(1);
    }
}

// 执行备份
main().catch(error => {
    console.error('💥 备份过程中发生严重错误:', error);
    process.exit(1);
});
