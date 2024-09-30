const fs = require('fs').promises;
const path = require('path');
const cliProgress = require('cli-progress');
const colors = require('ansi-colors');

// 获取文件夹中的所有文件
async function getAllFiles(dir) {
    let results = [];
    const list = await fs.readdir(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(await getAllFiles(filePath));
        } else {
            results.push({ path: filePath, stat: stat });
        }
    }
    return results;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
}

// 日志函数
function log(message, logFile) {
    console.log(message);
    const logFilePath = path.join('.log', logFile);
    fs.appendFile(logFilePath, message + '\n');
}

// 主函数
async function copyFiles() {
    const sourceDir = './build';
    const targetDirPath = '/www/leyla.top';

    const logFile = 'copy_log' + new Date().toISOString().replace(/:/g, '') + '.txt';

    try {
        // 获取所有需要复制的文件
        const files = await getAllFiles(sourceDir);
        const totalFiles = files.length;

        // 创建进度条
        const progressBar = new cliProgress.SingleBar({
            format: colors.green('{bar}') + ' {percentage}% | {value}/{total} 文件',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });
        progressBar.start(totalFiles, 0);

        let copiedFiles = 0;

        for (const file of files) {
            const relativePath = path.relative(sourceDir, file.path);
            const targetPath = path.join(targetDirPath, relativePath);
            const targetDir = path.dirname(targetPath);

            try {
                // 确保目标文件夹存在
                await fs.mkdir(targetDir, { recursive: true });

                // 检查目标文件是否已存在
                try {
                    await fs.access(targetPath);
                    // 文件已存在，跳过复制
                    log(colors.yellow(`跳过: ${relativePath} (${formatFileSize(file.stat.size)}) - 文件已存在`), logFile);
                } catch {
                    // 文件不存在，进行复制
                    await fs.copyFile(file.path, targetPath);
                    log(colors.green(`复制: ${relativePath} (${formatFileSize(file.stat.size)})`), logFile);
                }
            } catch (err) {
                log(colors.red(`错误: ${relativePath} - ${err.message}`), logFile);
            }

            copiedFiles++;
            progressBar.update(copiedFiles);
        }

        progressBar.stop();

        log(colors.green('\n复制完成！'), logFile);
        console.log(`详细日志已保存到 ${logFile}`);
    } catch (err) {
        console.error(colors.red('发生错误:'), err);
    }
}

copyFiles();