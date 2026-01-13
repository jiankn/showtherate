@echo off
REM ShowTheRate 快速备份脚本 (Windows)
REM 使用方法: backup-quick.bat [type]
REM type: full(默认), code, env

echo ShowTheRate 快速备份工具
echo ==========================

if "%1"=="" (
    set BACKUP_TYPE=full
) else (
    set BACKUP_TYPE=%1
)

echo 备份类型: %BACKUP_TYPE%
echo.

REM 创建备份目录
if not exist "backups" mkdir backups

REM 获取时间戳
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

echo 备份时间戳: %TIMESTAMP%
echo.

REM 根据类型执行备份
if "%BACKUP_TYPE%"=="full" (
    echo 执行完整备份...
    echo 1. 备份环境配置
    call :backup_env
    echo 2. 备份代码文件
    call :backup_code
    echo 3. 创建归档
    call :create_archive
) else if "%BACKUP_TYPE%"=="code" (
    echo 执行代码备份...
    call :backup_code
) else if "%BACKUP_TYPE%"=="env" (
    echo 执行环境配置备份...
    call :backup_env
) else (
    echo 错误: 无效的备份类型 "%BACKUP_TYPE%"
    echo 可用类型: full, code, env
    goto :error
)

echo.
echo ✅ 备份完成！
echo 备份文件位置: backups\
goto :end

:backup_env
echo 备份环境配置...
if exist ".env.example" (
    copy ".env.example" "backups\env_backup_%TIMESTAMP%.txt" >nul
    echo 环境变量模板已备份
) else (
    echo 警告: 未找到 .env.example 文件
)
goto :eof

:backup_code
echo 备份代码文件...
REM 创建临时目录进行备份
set TEMP_BACKUP=temp_backup_%TIMESTAMP%
mkdir %TEMP_BACKUP%

REM 复制文件，排除不需要的目录
xcopy /E /I /H /Y "." "%TEMP_BACKUP%\" ^
    /EXCLUDE:exclude_backup.txt >nul 2>&1

REM 创建排除文件（如果不存在）
if not exist "exclude_backup.txt" (
    echo node_modules\ > exclude_backup.txt
    echo .next\ >> exclude_backup.txt
    echo .git\ >> exclude_backup.txt
    echo *.log >> exclude_backup.txt
    echo .env* >> exclude_backup.txt
    echo backups\ >> exclude_backup.txt
)

REM 压缩为ZIP文件
powershell "Compress-Archive -Path '%TEMP_BACKUP%\*' -DestinationPath 'backups\code_backup_%TIMESTAMP%.zip' -Force"

REM 清理临时目录
rmdir /S /Q %TEMP_BACKUP%
del exclude_backup.txt >nul 2>&1

echo 代码已备份到: backups\code_backup_%TIMESTAMP%.zip
goto :eof

:create_archive
echo 创建完整归档...
powershell "Compress-Archive -Path 'backups\*' -DestinationPath 'backups\showtherate_backup_%TIMESTAMP%.zip' -Force"
echo 完整备份归档: backups\showtherate_backup_%TIMESTAMP%.zip
goto :eof

:error
exit /b 1

:end
echo.
echo 下次运行命令示例:
echo   backup-quick.bat full    ^(完整备份^)
echo   backup-quick.bat code    ^(仅代码^)
echo   backup-quick.bat env     ^(仅环境配置^)
echo.
