const chalk = require("./chalk");

const acceptPrefix = "abcdefghijklmnopqrstuvwxyz_".split("");
const acceptChars = "abcdefghijklmnopqrstuvwxyz_-0123456789".split("");

function ClassGenerator() {
  this.newClassMap = {};
  this.newClassSize = -1;
  this.context = {};
  this.unusedClass = [];
}

function stripEscapeSequence(words) {
  return words.replace(/\\/g, "");
}

ClassGenerator.prototype = {
  init(newClassMap = {}, newClassSize = -1, unusedClass = []) {
    this.newClassMap = newClassMap;
    this.newClassSize = newClassSize;
    this.unusedClass = unusedClass;
  },
  defaultClassGenerator: function () {
    const chars = [];
    let rest =
      (this.newClassSize - (this.newClassSize % acceptPrefix.length)) /
      acceptPrefix.length;
    if (rest > 0) {
      while (true) {
        rest -= 1;
        const m = rest % acceptChars.length;
        const c = acceptChars[m];
        chars.push(c);
        rest -= m;
        if (rest === 0) {
          break;
        }
        rest /= acceptChars.length;
      }
    }
    const prefixIndex = this.newClassSize % acceptPrefix.length;

    const newClassName = `${acceptPrefix[prefixIndex]}${chars.join("")}`;
    return newClassName;
  },
  generateClassName: function (original, opts) {
    console.log(original);

    original = stripEscapeSequence(original);
    const cn = this.newClassMap[original];
    if (cn) {
      if (this.newClassMap[original].num === -1) {
        // 这个说明上一次标记为废弃，但这次类名又出现了，删除unusedClass保存键
        this.unusedClass = this.unusedClass.filter((item) => item !== original);
        this.newClassMap[original].num = 0;
      }
      this.newClassMap[original].num++;
      return cn;
    }

    let newClassName;
    if (this.unusedClass.length > 0) {
      const key = this.unusedClass.shift();
      newClassName = this.newClassMap[key].name;
      delete this.newClassMap[key];
    } else {
      this.newClassSize++;
    }

    if (!newClassName) {
      if (opts.classGenerator) {
        newClassName = opts.classGenerator(original, opts, this.context);
      } else {
        newClassName = this.defaultClassGenerator();
      }
    }

    if (opts.reserveClassName && opts.reserveClassName.includes(newClassName)) {
      if (opts.log) {
        console.log(
          `The class name has been reserved. ${chalk.green(newClassName)}`
        );
      }
      return this.generateClassName(original, opts);
    }
    if (opts.log) {
      console.log(
        `Minify class name from ${chalk.green(original)} to ${chalk.green(
          newClassName
        )}`
      );
    }
    const newClass = {
      name: newClassName,
      num: 1,
    };
    this.newClassMap[original] = newClass;
    return newClass;
  },
};

module.exports = ClassGenerator;
