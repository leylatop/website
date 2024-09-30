const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');
const SftpClient = require('ssh2-sftp-client');
const os = require('os');
const cliProgress = require('cli-progress');
const colors = require('ansi-colors');

function expandTilde(filePath) {
  if (filePath[0] === '~') {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

// 读取SSH配置文件
function readSshConfig() {
  const configPath = path.join(os.homedir(), '.ssh', 'config');
  const config = fs.readFileSync(configPath, 'utf8');
  const lines = config.split('\n');
  let host = {};
  let currentHost = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    // 去掉被注释的行
    if (trimmedLine.startsWith('#')) {
      continue;
    }
    if (trimmedLine.startsWith('Host ')) {
      currentHost = trimmedLine.split(' ')[1];
      host[currentHost] = {};
    } else if (currentHost && trimmedLine.includes(' ')) {
      const [key, ...valueParts] = trimmedLine.split(' ');
      let value = valueParts.join(' ');
      if (key.toLowerCase() === 'identityfile') {
        value = expandTilde(value);
      }
      host[currentHost][key.toLowerCase()] = value;
    }
  }

  return host['qxx'];
}

// 读取私钥文件
function readPrivateKey(identityFile) {
  return fs.readFileSync(identityFile, 'utf8');
}

// 获取目录中的所有文件
function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(file));
    } else {
      results.push({ path: file, size: stat.size });
    }
  });
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
function log(message, logStream) {
  console.log(message);
  logStream.write(message + '\n');
}

// 上传
async function uploadDir(sftp, localDir, remoteDir, logStream) {
  // 获取所有需要上传的文件
  const files = getAllFiles(localDir);
  const totalFiles = files.length;

  // 创建多栏进度条
  const multibar = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true,
    format: '{bar} | {percentage}% | {value}/{total} Files | {filename}'
  }, cliProgress.Presets.shades_classic);

  const uploadBar = multibar.create(totalFiles, 0, { filename: 'Uploading' });
  const skipBar = multibar.create(totalFiles, 0, { filename: 'Skipped  ' });

  let uploadedFiles = 0;
  let skippedFiles = 0;

  // 上传文件
  for (const file of files) {
    const relativePath = path.relative(localDir, file.path);
    const remoteFile = path.join(remoteDir, relativePath);
    
    try {
      const stats = await sftp.stat(remoteFile);
      if (stats) {
        // 文件已存在，跳过
        log(colors.yellow(`跳过: ${relativePath} (${formatFileSize(file.size)}) - File already exists`), logStream);
        skippedFiles++;
        skipBar.update(skippedFiles, { filename: colors.yellow('Skipped  ') });
      }
    } catch (err) {
      try {
        await sftp.put(file.path, remoteFile);
      } catch (err) {
        // 文件不存在，尝试创建目录
        await sftp.mkdir(path.dirname(remoteFile), true);
        await sftp.put(file.path, remoteFile);
      }
      log(colors.green(`上传: ${relativePath} (${formatFileSize(file.size)})`), logStream);
      uploadedFiles++;
      uploadBar.update(uploadedFiles, { filename: colors.green('Uploading') });
    }
  }

  multibar.stop();
}

// 主函数
async function main() {
  const sshConfig = readSshConfig();
  const privateKey = readPrivateKey(sshConfig.identityfile);
  const conn = new Client();
  const sftp = new SftpClient();

  // 创建日志目录和文件
  const logFile = path.join('.log', `upload_${new Date().toISOString().replace(/:/g, '-')}.log`);
  const logStream = fs.createWriteStream(logFile);

  try {
    // 连接到远程服务器
    await new Promise((resolve, reject) => {
      conn.on('ready', resolve).on('error', reject).connect({
        hostname: sshConfig.hostname,
        username: sshConfig.user,
        privateKey: privateKey
      });
    });

    log('SSH连接成功', logStream);

    // 使用SFTP上传文件
    await sftp.connect({
      hostname: sshConfig.hostname,
      username: sshConfig.user,
      privateKey: privateKey
    });

    log('SFTP连接成功', logStream);

    const localDir = './build';
    const remoteDir = '/www/leyla.top';

    await uploadDir(sftp, localDir, remoteDir, logStream);

    log('文件上传完成', logStream);
  } catch (err) {
    log(colors.red('发生错误:' + err), logStream);
  } finally {
    sftp.end();
    conn.end();
    log('连接已关闭', logStream);
    logStream.end();
  }
}

main();