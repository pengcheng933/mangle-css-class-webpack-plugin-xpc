const fs = require("fs");
const path = require("path");
const optimizer = require("./optimizer");
const ClassGenerator = require("./classGenerator");
const traverseDirectory = require("./addClassPre");

const runner = (compiler, compilation, opts, classGenerator) => {
  const optimize = optimizer(compiler, compilation, opts, classGenerator);
  return (assets, callback) => {
    optimize(assets);
    callback();
  };
};

let classGenerator;
const cachePath = path.resolve(__dirname, "cache.json");
console.log(cachePath);

const detectingExistenceFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.access(path, fs.constants.F_OK, (err) => {
      if (err) {
        // 如果文件不存在则创建文件
        fs.writeFile(path, "{}", (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  });
};
const gettingCache = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(cachePath, "utf8", (err, data) => {
      if (err) reject(err);
      resolve(JSON.parse(data));
    });
  });
};
class Plugin {
  constructor(opts = {}) {
    this.opts = opts;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(
      "MangleCssClassPluginHooks",
      (compilation) => {
        compilation.hooks.optimizeChunkAssets.tapAsync(
          "MangleCssClassPluginOptimizeChunkAssetsHooks",
          async (assets, callback) => {
            if (this.opts.replacePath) {
              // 有替换路劲执行替换操作
              await traverseDirectory(
                this.opts.replacePath,
                this.opts.nameSubstitutionPrefix
              );
            }

            if (!classGenerator) {
              classGenerator = new ClassGenerator();
              await detectingExistenceFile(cachePath);
              const cacheObj = await gettingCache();
              if (cacheObj?._newClassSize?.name) {
                console.log("have cache");

                const unusedClass = [];
                for (const key in cacheObj) {
                  if (cacheObj[key].num === -1) {
                    unusedClass.push(key);
                  } else {
                    cacheObj[key].num = 0;
                  }
                }
                classGenerator.init(
                  cacheObj,
                  cacheObj._newClassSize.name,
                  unusedClass
                );
              }
            }
            runner(
              compiler,
              compilation,
              this.opts,
              classGenerator
            )(assets, callback);
          }
        );
      }
    );
    compiler.hooks.afterEmit.tapAsync(
      "SaveDataPlugin",
      (compilation, callback) => {
        const cacheObj = classGenerator.newClassMap;
        for (const key in cacheObj) {
          if (cacheObj[key].num <= 0) {
            cacheObj[key].num = -1;
          }
        }
        cacheObj._newClassSize = {
          name: classGenerator.newClassSize,
          num: 1,
        };
        fs.writeFile(cachePath, JSON.stringify(cacheObj), "utf8", (err) => {
          if (err) {
            console.log(err);
          }
        });
        callback();
      }
    );
  }
}

module.exports = Plugin;

/**
 * 每次打包获取缓存对象, /cache.json 格式{ 类名: { name: 'xx', num: 'xx'} }
 * 将缓存对象还原到ClassGenerator的newClassMap和newClassSize中
 *    缓存对象看看是不是有为-1的值，有的话提取键出来放入到一个数组中保存
 *    将对象的num全部改为0
 * 当发现是一个新的类名，那么需要先判断是否存在未使用的类名，有的话用这个，没有重新生成
 *    有为使用的类名依据： unusedClass的长度不为0
 *    使用方式，newClassMap中新兼职对等于旧键值对的值，删除旧键值对
 * 打包结束，对比newClassMap是不是有没使用的类名，有的话提取对应类名出来放到新的缓存里并保存
 *    循环看看num是不是有小于或者等于0的类名，有的话全部改为-1，表示它们的类名没有使用的了，下一次可以用它们生成的类名
 */
//   const classnameRegex = /(?<![a-zA-Z0-9])test-[a-zA-Z0-9_-]+/g
