const { ReplaceSource } = require('webpack-sources')

const optimize = (chunk, compilation, opts, classGenerator) =>
  chunk.files.forEach((file) => {
    let classnameRegex
    if (file.match(/.+\.css.*$/)) {
      classnameRegex = new RegExp(`\\\.(${opts.classNameRegExp})`, 'g')
    } else if (file.match(/.+\.js.*$/) || file.match(/.+\.html.*$/)) {
      classnameRegex = new RegExp(`["'.\\\s](${opts.classNameRegExp})`, 'g')
    }
    if (!classnameRegex) {
      return
    }
    if (opts.ignorePrefix && opts.ignorePrefixRegExp) {
      throw new Error('Use only either "ignorePrefix" or "ignorePrefixRegExp".')
    }
    let ignorePrefixRegExp
    if (opts.ignorePrefixRegExp) {
      ignorePrefixRegExp = new RegExp(`^${opts.ignorePrefixRegExp}`)
    }

    const originalSource = compilation.assets[file]
    const rawSource = originalSource.source()
    let source
    while ((match = classnameRegex.exec(rawSource))) {
      const originalName = match[1]
      let targetName = originalName

      let originalPrefix = ''
      if (opts.ignorePrefix) {
        let ignorePrefix = opts.ignorePrefix
        if (typeof ignorePrefix === 'string') {
          ignorePrefix = [ignorePrefix]
        }
        for (let i = 0; i < ignorePrefix.length; i++) {
          if (originalName.startsWith(ignorePrefix[i])) {
            originalPrefix = ignorePrefix[i]
            break
          }
        }
      }
      if (ignorePrefixRegExp) {
        const prefix = ignorePrefixRegExp.exec(originalName)
        if (prefix && prefix.length > 0) {
          originalPrefix = prefix[0]
        }
      }
      if (originalPrefix) {
        targetName = originalName.substr(originalPrefix.length)
        if (opts.log) {
          console.log(
            `Skip the prefix ${chalk.red(originalPrefix)} of ${chalk.green(
              originalName
            )}`
          )
        }
      }

      newClass = classGenerator.generateClassName(targetName, opts)
      if (!source) source = new ReplaceSource(originalSource)
      const startPos = match.index + match[0].indexOf(match[1])
      // newClass.usedBy.push(`${file}:${startPos}`)
      const newClassName = `${originalPrefix}${newClass.name}`
      source.replace(startPos, startPos + originalName.length - 1, newClassName)
    }
    if (!source) {
      return
    }
    compilation.assets[file] = source
  })

const optimizer = (compiler, compilation, opts, classGenerator) => (chunks) => {
  chunks.forEach((chunk) => optimize(chunk, compilation, opts, classGenerator))
}

module.exports = optimizer
