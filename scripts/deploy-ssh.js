const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');
const SftpClient = require('ssh2-sftp-client');
const os = require('os');
const cliProgress = require('cli-progress');


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
      results.push(file);
    }
  });
  return results;
}

// 上传
async function uploadDir(sftp, localDir, remoteDir) {
  // 配置选项
  const options = {
    overwrite: true, // 是否覆盖已存在的文件
    preserveTimestamps: true, // 是否保留原始时间戳
  };

  // 获取所有需要上传的文件
  const files = getAllFiles(localDir);
  const totalFiles = files.length;

  // 创建进度条
  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  progressBar.start(totalFiles, 0);

  let uploadedFiles = 0;

  // 上传文件
  for (const file of files) {
    const remoteFile = path.join(remoteDir, path.relative(localDir, file));
    
    await sftp.put(file, remoteFile);
    uploadedFiles++;
    progressBar.update(uploadedFiles);
  }

  progressBar.stop();
}


// 主函数
async function main() {
  const sshConfig = readSshConfig();
  const privateKey = readPrivateKey(sshConfig.identityfile);
  const conn = new Client();
  const sftp = new SftpClient();

  try {
    // 连接到远程服务器
    await new Promise((resolve, reject) => {
      conn.on('ready', resolve).on('error', reject).connect({
        hostname: sshConfig.hostname,
        username: sshConfig.user,
        privateKey: privateKey
      });
    });

    console.log('SSH连接成功');

    // 删除远程文件夹中的所有文件
    // await new Promise((resolve, reject) => {
    //   conn.exec('rm -rf /www/leyla.top/*', (err, stream) => {
    //     if (err) reject(err);
    //     stream.on('close', resolve).on('data', (data) => {
    //       console.log('删除操作输出:', data.toString());
    //     });
    //   });
    // });

    console.log('远程文件删除完成');

    // 使用SFTP上传文件
    await sftp.connect({
      hostname: sshConfig.hostname,
      username: sshConfig.user,
      privateKey: privateKey
    });

    console.log('SFTP连接成功');

    
    const localDir = './build';
    const remoteDir = '/www/leyla.top';

    await uploadDir(sftp, localDir, remoteDir);

    console.log('文件上传完成');
  } catch (err) {
    console.error('发生错误:', err);
  } finally {
    sftp.end();
    conn.end();
    console.log('连接已关闭');
  }
}

main();