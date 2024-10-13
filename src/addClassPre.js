const path = require('path')
const fs = require('fs')

const pwdPath = process.cwd()
// 需要处理的文件
const replaceFile = 'assets/css/test.less'

const noDirectoryReplacement = [
  '.git',
  '.nuxt',
  'plugins',
  '.vscode',
  'middleware',
  'node_modules',
  'static',
  'store'
]

function processTemplate(templateStr) {
  // 处理HTML中 class="x y z" 的情况
  //   const classPattern = /class="([^"]+)"/g
  const classPattern = /(?<!:|-)class="([^"]+)"/g
  templateStr = templateStr.replace(classPattern, (match, classNames) => {
    // 将每个类名拆分并分别处理
    const processedClassNames = classNames
      .split(/\s+/) // 按空格分隔多个类名
      .map((className) => {
        // 只为不以 'cl-' 或 'no-' 开头的类名加上 'cl-'
        if (!className.startsWith('cl-') && !className.startsWith('no-')) {
          return `cl-${className}`
        }
        return className
      })
      .join(' ') // 重新组合类名
    return `class="${processedClassNames}"`
  })

  // 处理CSS中的 .x { 的情况
  // const cssPattern = /\.((?!cl-|no-)[a-zA-Z0-9_-]+)\s*\{/g
  // templateStr = templateStr.replace(cssPattern, '.cl-$1 {')
  const cssPattern = /\.((?!cl-|no-)[a-zA-Z0-9_-]+)(:[a-zA-Z0-9_-]+)?\s*\{/g
  templateStr = templateStr.replace(cssPattern, '.cl-$1$2 {')
  return templateStr
}

function addClassPre(fullPath, data) {
  // x都是字符串和数字和-和_ 也就是遵循类命名方式
  // 找到class="x"中间的值然后加前缀为为class="o-x"
  // 找到.x {中间的值然后加前缀为.o-x {
  // 如果是以o-开头那么久不替换了,保持原样 如果是 no-开头的也不替换
  fs.writeFile(fullPath, processTemplate(data), 'utf8', (err) => {
    if (err) {
      console.log('写入失败', err)
      return
    }
    console.log('写入成功')
  })
}

function traverseDirectory(dir, replaceFile) {
  if (replaceFile) {
    const fullPath = path.resolve(dir, replaceFile)
    console.log(fullPath)

    fs.readFile(fullPath, 'utf8', (err, data) => {
      if (err) return
      addClassPre(fullPath, data)
    })
    return
  }
  // 读取当前目录下的所有文件和文件夹
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error(`无法读取目录: ${dir}`, err)
      return
    }

    // 遍历目录中的每一个文件或文件夹
    files.forEach((file) => {
      //   console.log(file, ' file>>>>>')
      if (noDirectoryReplacement.includes(file)) return
      const fullPath = path.join(dir, file)

      // 获取文件或目录的状态
      fs.stat(fullPath, (err, stats) => {
        if (err) {
          console.error(`无法获取文件状态: ${fullPath}`, err)
          return
        }

        if (stats.isDirectory()) {
          // 如果是目录，递归调用
          //   console.log(`目录: ${fullPath}`)
          traverseDirectory(fullPath) // 递归调用
        } else {
          // 如果是文件，输出文件路径
          //   console.log(`文件: ${fullPath}`)
          // eslint-disable-next-line no-lonely-if
          if (fullPath.endsWith('.vue') || fullPath.endsWith('.less')) {
            fs.readFile(fullPath, 'utf8', (err, data) => {
              if (err) return
              addClassPre(fullPath, data)
            })
          }
        }
      })
    })
  })
}

traverseDirectory(pwdPath, replaceFile)
