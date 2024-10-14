const fs = require('fs');
const path = require('path');
// const matter = require('gray-matter');
const { minimatch } = require('minimatch')
// function isExcluded({
//   filePath,
//   docsPath,
//   exclude = {
//     extensions: [],
//     folders: ['node_modules', '.git']
//   }
// }) {
//   const relativePath = path.relative(docsPath, filePath);
//   const isExcludedFolder = exclude.folders.some(folder =>
//     relativePath.startsWith(folder + path.sep) || relativePath === folder
//   );
//   const isExcludedExtension = exclude.extensions.includes(path.extname(filePath));
//   return isExcludedFolder || isExcludedExtension;
// }

// function isIncluded({
//   filePath,
//   docsPath,
//   include = {
//     extensions: ['.md', '.mdx'],
//     folders: []
//   }
// }) {
//   const stats = fs.statSync(filePath);
//   if (stats.isDirectory()) {
//     const relativePath = path.relative(docsPath, filePath);
//     return include.folders.length === 0 || include.folders.some(folder =>
//       relativePath.startsWith(folder + path.sep) || relativePath === folder
//     );
//   }
//   return include.extensions.includes(path.extname(filePath));
// }

// function isExcluded({ filePath, docsPath, exclude }) {
//   const relativePath = path.relative(docsPath, filePath);
//   return exclude.some(pattern => minimatch(relativePath, pattern));
// }

// function isIncluded({ filePath, docsPath, include }) {
//   // console.log('---filePath',filePath)
//   // console.log('---docsPath',docsPath)

//   const relativePath = path.relative(docsPath, filePath);
//   // console.log('---relativePath',relativePath)
  
//   return include.some(pattern => {
//     const filePathResult = minimatch(filePath, pattern, { matchBase: true })
//     const relativePathResult = minimatch(relativePath, pattern, { matchBase: true })
//     console.log('================================')
//     console.log('---pattern',pattern)
//     console.log('---filePathResult',filePath, filePathResult)
//     console.log('---relativePathResult',relativePath, relativePathResult)
//     return relativePathResult
//   });
// }


function generateSidebar(docsPath, options = {}) {
  const {
    include = {
      extensions: ['.md', '.mdx'],
      folders: []
    },
    exclude = {
      extensions: [],
      folders: ['node_modules', '.git']
    }
  } = options;
  
  const items = [];
  const files = fs.readdirSync(docsPath);

  files.forEach(file => {
    const filePath = path.join(docsPath, file);

    // const isInclude = isIncluded({filePath, docsPath, include})
    // if(!isIncluded({filePath, docsPath, include})) return;

    // const isExclude = isExcluded({filePath, docsPath, exclude})
    // if (isExcluded({filePath, docsPath, exclude})) return;

    
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      const subItems = generateSidebar(filePath, options);
      if (subItems.length > 0) {
        items.push({
          // type: 'category',
          label: path.basename(filePath),
          items: subItems,
        });
      }
    } else {
      // const content = fs.readFileSync(filePath, 'utf8');
      // const { data } = matter(content) || {}
      // debugger
      items.push({
        type: 'doc',
        id: path.relative(docsPath, filePath).replace(/\\/g, '/').replace(/\.mdx?$/, ''),
        label: path.basename(file, path.extname(file)),
        // createdAt: data.date || stats.ctime
      });
    }
  });

  // files.forEach(file => {
  //   if (path.extname(file) === '.md') {
  //     const filePath = path.join(docsPath, file);
  //     const content = fs.readFileSync(filePath, 'utf8');
  //     const { data } = matter(content);
  //     // 获取file的创建时间
  //     const stat = fs.statSync(filePath);
  //     // debugger
  //     items.push({
  //       type: 'doc',
  //       id: path.basename(file, '.md'),
  //       // label: data.title || path.basename(file, '.md'),
  //       createdAt: fs.statSync(filePath).ctime
  //     });
  //   }
  // });

  // 按创建时间排序
  // items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return items
}

const sidebar = {
  docs: generateSidebar('docs', {
    include: ['📓 学习笔记/**', '🤦 Remind me.md'],
    exclude: ['**/*.pdf', '**/*.xmind', '**/*.jpg', '**/asset/**']
    // include: {
    //   extensions: ['.md', '.mdx'],
    //   file: ['README.md'],
    //   folders: ['📓 学习笔记', 'api'] // 例如，只包含 guide 和 api 文件夹
    // },
    // exclude: {
    //   extensions: ['.test.md', '.spec.md'],
    //   folders: ['drafts', 'internal']
    // }
  })
};

fs.writeFileSync('sidebars.ts', `module.exports = ${JSON.stringify(sidebar, null, 2)};`);