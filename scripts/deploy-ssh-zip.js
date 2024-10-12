const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');
const SftpClient = require('ssh2-sftp-client');
const os = require('os');
const crypto = require('crypto');
const archiver = require('archiver');
const cliProgress = require('cli-progress');
const colors = require('ansi-colors');
const { on } = require('events');

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

// 压缩文件夹并计算哈希
function compressAndHash(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    const hash = crypto.createHash('sha256');

    output.on('close', () => {
      const fileHash = hash.digest('hex');
      resolve(fileHash);
    });

    archive.on('error', reject);
    archive.on('data', (chunk) => hash.update(chunk));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// 获取目录中的所有文件
// function getAllFiles(dir) {
//   let results = [];
//   const list = fs.readdirSync(dir);
//   list.forEach(file => {
//     file = path.join(dir, file);
//     const stat = fs.statSync(file);
//     if (stat && stat.isDirectory()) {
//       results = results.concat(getAllFiles(file));
//     } else {
//       results.push({ path: file, size: stat.size });
//     }
//   });
//   return results;
// }

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

// 在远程服务器上执行命令
async function executeRemoteCommand(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) reject(err);
      let output = '';
      stream.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Command failed with exit code ${code}`));
        } else {
          resolve(output);
        }
      }).on('data', (data) => {
        output += data;
      });
    });
  });
}

// 上传
// async function uploadDir(sftp, localDir, remoteDir, logStream) {
//   // 获取所有需要上传的文件
//   const files = getAllFiles(localDir);
//   const totalFiles = files.length;

//   // 创建多栏进度条
//   const multibar = new cliProgress.MultiBar({
//     clearOnComplete: false,
//     hideCursor: true,
//     format: '{bar} | {percentage}% | {value}/{total} Files | {filename}'
//   }, cliProgress.Presets.shades_classic);

//   const uploadBar = multibar.create(totalFiles, 0, { filename: 'Uploading' });
//   const skipBar = multibar.create(totalFiles, 0, { filename: 'Skipped  ' });

//   let uploadedFiles = 0;
//   let skippedFiles = 0;

//   // 上传文件
//   for (const file of files) {
//     const relativePath = path.relative(localDir, file.path);
//     const remoteFile = path.join(remoteDir, relativePath);
    
//     try {
//       const stats = await sftp.stat(remoteFile);
//       if (stats) {
//         // 文件已存在，跳过
//         log(colors.yellow(`跳过: ${relativePath} (${formatFileSize(file.size)}) - File already exists`), logStream);
//         skippedFiles++;
//         skipBar.update(skippedFiles, { filename: colors.yellow('Skipped  ') });
//       }
//     } catch (err) {
//       try {
//         await sftp.put(file.path, remoteFile);
//       } catch (err) {
//         // 文件不存在，尝试创建目录
//         await sftp.mkdir(path.dirname(remoteFile), true);
//         await sftp.put(file.path, remoteFile);
//       }
//       log(colors.green(`上传: ${relativePath} (${formatFileSize(file.size)})`), logStream);
//       uploadedFiles++;
//       uploadBar.update(uploadedFiles, { filename: colors.green('Uploading') });
//     }
//   }

//   multibar.stop();
// }

// 主函数
async function main() {
  const sshConfig = readSshConfig();
  const privateKey = readPrivateKey(sshConfig.identityfile);
  const conn = new Client();
  const sftp = new SftpClient();

  // 创建日志目录和文件
  const logFile = path.join('.log', `deploy_${new Date().toISOString().replace(/:/g, '')}.log`);
  const logStream = fs.createWriteStream(logFile);

  const localDir = './build';
  const zipFile = `deploy-${new Date().toISOString().replace(/:/g, '')}.zip`;
  try {
    // 压缩build文件夹并计算哈希
    log('正在压缩文件夹并计算哈希...', logStream);
    const localFileHash = await compressAndHash(localDir, zipFile);
    log(`压缩完成。本地文件哈希: ${localFileHash}`, logStream);

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

    const remoteTargetDir = '/www/leyla.top';
    const remoteDir = '/www/deploy-leylatop';
    const remoteZipPath = path.join(remoteDir, zipFile);

    // 获取zip文件大小
    const fileSize = fs.statSync(zipFile).size;
    log(`zip文件大小为 ${(fileSize / 1024 / 1024).toFixed(2)} MB`, logStream);
    log('开始上传zip文件...', logStream);
    process.stdout.write('\n'); // 为进度条新起一行

    await sftp.put(zipFile, remoteZipPath);
    log('zip文件上传完成', logStream);
    // 计算远程文件的哈希值
    log('正在计算远程文件哈希...', logStream);
    let remoteFileHash = await executeRemoteCommand(conn, `sha256sum ${remoteZipPath} | awk '{print $1}'`);
    remoteFileHash = remoteFileHash.trim().replace('\n', '');
    log(`远程文件哈希: ${remoteFileHash}`, logStream);

    // 比较本地和远程文件的哈希值
    if (localFileHash === remoteFileHash) {
      log('文件哈希值匹配，传输成功！', logStream);
    } else {
      throw new Error('文件哈希值不匹配，传输可能出现问题！');
    }

    // 在远程服务器上解压文件
    log('正在解压文件...', logStream);
    // 将远程zip文件解压到远程目录，-o表示覆盖已存在的文件
    await executeRemoteCommand(conn, `unzip -o ${remoteZipPath} -d ${remoteTargetDir}`);
    log('文件解压完成', logStream);

    // 删除远程zip文件
    // log('正在删除远程zip文件...', logStream);
    // await executeRemoteCommand(conn, `rm ${remoteZipPath}`);
    // log('远程zip文件已删除', logStream);

    log('部署完成', logStream);
  } catch (err) {
    log(colors.red('发生错误:' + err), logStream);
  } finally {
    sftp.end();
    conn.end();
    // 删除本地zip文件
    // fs.unlinkSync(zipFile);
    // log('本地zip文件已删除', logStream);
    log('连接已关闭', logStream);
    logStream.end();
  }
}

main();