# mangle-css-class-webpack-plugin-xpc

class 类名混淆，类名缩短

## 示例

```javascript
const MangleCssClassPlugin = require('mangle-css-class-webpack-plugin-xpc');

module.exports = {
  ...
  plugins: [
    new MangleCssClassPlugin({
        classNameRegExp: 'cl-[a-zA-Z0-9_-]*',
        mangleCssVariables: true,
        log: false
    }),
  ],
};
```

## 功能介绍

代码来自于 [mangle-css-class-webpack-plugin](https://www.npmjs.com/package/mangle-css-class-webpack-plugin) 插件，经过改造使其适用于自己的项目
再原来的基础上增加了如下功能

- 给类名增加前缀
  项目只是后面优化，所有功能都已经完成了，原始插件代码是识别到特殊前缀开头然后按照所用规则重新生成类名，我们项目并没有特殊前缀，所以需要给类名加上前缀
  这是直接改源代码，只需要执行一次，注意以'no-'开头的不加前缀，所以不想执行增加前缀的话可以提前加前缀
  示例

```javascript
const MangleCssClassPlugin = require('mangle-css-class-webpack-plugin-xpc');

module.exports = {
  ...
  plugins: [
    new MangleCssClassPlugin({
        classNameRegExp: 'cl-[a-zA-Z0-9_-]*',
        mangleCssVariables: true,
        log: false,
        nameSubstitutionPrefix: 'cl-', // 加的前缀和classNameRegExp对应
        replacePath: 'src' // 替换的路径可以是文件夹或者具体文件
    }),
  ],
};
```

```javascript
// index.vue
<template>
  <div class="test1 test2 no-test3" :class="testClass"></div>
</template>
<script>
export default {
  data() {
    return {
      testClass: "testClass",
    };
  },
};
</script>
<style scoped>
.test1 {
  color: red;
}
.test2 {
  color: pink;
}
.no-test3 {
  color: aqua;
}
</style>

// 执行替换完的代码

<template>
  <div class="test1 test2 no-test3" :class="testClass"></div>
</template>
<script>
export default {
  data() {
    return {
      // 注意不替换动态类名
      testClass: "testClass",
    };
  },
};
</script>
<style scoped>
.test1 {
  color: red;
}
.test2 {
  color: pink;
}
.no-test3 {
  color: aqua;
}
</style>

</style>

```

- 缓存机制
  里面增加 cache.json 文件用来缓存类名，防止每次生成的类名不一致，这样有利于优化 CSS，利用缓存机制不必每次都加载 CSS

- 动态类名
  动态类名过于复杂，这里手动替换，替换方案如下
  1. 变量命名可以替换
  2. 对象类名也可以替换
  3. 字符串拼接不能替换

```vue
<template>
  <div :class="[testClass, { 'cl-test2': true }, 'no-test' + num]"></div>
</template>
<script>
export default {
  data() {
    return {
      testClass: "cl-test1",
      test1: true,
      num: 3,
    };
  },
};
</script>
<style scoped>
.cl-test1 {
  color: red;
}
.test2 {
  color: pink;
}
.no-test3 {
  color: aqua;
}
</style>
```
