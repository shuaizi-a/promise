(function () {
  // 自己实现一个Promise类，实现内置Promise的重写(PromiseAplus)
  // https://promisesaplus.com/
  function Promise(executor) {
    // 必须保证executor是一个函数
    if (typeof executor !== "function") {
      throw new TypeError("Promise resolver" + executor + "is not a function");
    }

    // 存储的是promise的实例
    var self = this;
    self.PromiseState = "pending";
    self.PromiseResult = undefined;
    self.onFULFILLEDCallback = [];
    self.onREJECTEDCallback = [];

    //  执行resolve/reject都是修改当前实例的状态和结果
    // + 状态一旦被更改后就不能更改了

    var run = function run(state, result) {
      if (self.PromiseState !== "pending") return;
      self.PromiseState = state; // 成功状态
      self.PromiseResult = result;

      var arr =
        state === "fulfilled"
          ? self.onFULFILLEDCallback
          : self.onREJECTEDCallback;

      // 执行resolve/rejec的时候，立即更改状态信息，但是不会立即通知方法执行 (需要定时器包一层)
      setTimeout(() => {
        for (var i = 0; i < arr.length; i++) {
          var itemFUNC = arr[i];
          if (typeof itemFUNC === "function") {
            itemFUNC(self.PromiseResult);
          }
        }
      });
    };

    var resolve = function resolve(value) {
      run("fulfilled", value);
    };
    var reject = function reject(value) {
      run("rejected", value);
    };

    // 立即执行executor函数 (回调函数嵌回调函数): 如果函数执行报错了，则promise状态也要更改为失败状态
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  // 统一处理基于then返回新实例的成功和失败
  function resolvePromise(promise, x, resolve, rejecrt) {
    // 如果onfulfilled, onrejected返回的值和创建的新实例是一个东西，则产生死循环，我们直接让其报错
    if (promise === x) {
      throw new TypeError("chanining cycle detected for promise #<Promise>");
    }

    if ((x !== null && typeof x === "object") || typeof x === "function") {
      try {
        var then = x.then;
        if (typeof then === "function") {
          // 返回结果是一个新的promise实例 不一定是你自己构建的promise，还可能是别人构建的promise
          then.call(
            x,
            function (y) {
              resolve(y);
            },
            function (r) {
              rejecrt(r);
            }
          );
        } else {
          resolve(x);
        }
      } catch (error) {
        rejecrt(error);
      }
    } else {
      resolve(x);
    }
  }

  // promise原型上应该有then这个方法
  Promise.prototype = {
    customize: true, // 代表是我自己写的不是内置类
    constructor: Promise,
    then: function (onfulfilled, onrejected) {
      // 处理不传onfulfilled, onrejected的情况
      if (typeof onfulfilled !== "function") {
        onfulfilled = function onfulfilled(value) {
          return value;
        };
      }

      if (typeof onrejected !== "function") {
        onrejected = function onrejected(value) {
          return value;
        };
      }
      // self原始Promise实例
      // promise：新返回的promise实例 resolve/reject执行成功失败
      //  + 但是到底执行谁  resolve/reject 哪个方法是由onfulfilled, onrejected方法执行是否报错，以及它的返回结果是否为最新的promise来决定
      var self = this;
      var promise = new Promise(function (resolve, reject) {
        switch (self.PromiseState) {
          case "fulfilled":
            setTimeout(function () {
              try {
                var x = onfulfilled(self.PromiseResult);
                resolvePromise(promise, x, resolve, reject);
              } catch (error) {
                reject(error);
              }
            });
            break;
          case "rejected":
            setTimeout(function () {
              try {
                var x = onrejected(self.PromiseResult);
                resolvePromise(promise, x, resolve, reject);
              } catch (error) {
                reject(error);
              }
            });
            break;
          default:
            //  存方法
            // 这样写的目的把onfulfilled, onrejected放在不同的容器里面，后期知道状态为啥后，通知某个容器中的方法执行，其实最后执行的就是存储进来的onfulfilled, onrejected
            // self.onFULFILLEDCallback.push(onfulfilled);
            // self.onREJECTEDCallback.push(onrejected);

            // 现在处理的方案：向容器中存储匿名函数，后期状态改变后，先把匿名函数执行(给匿名函数传值)，我们在匿名函数中再把onfulfilled, onrejected执行，这样达到了相同的结果，但是我们可以监听onfulfilled, onrejected执行是否报错和他们的返回值
            self.onFULFILLEDCallback.push(function (PromiseResult) {
              try {
                var x = onfulfilled(PromiseResult);
                resolvePromise(promise, x, resolve, reject);
              } catch (error) {
                reject(error);
              }
            });
            self.onREJECTEDCallback.push(function (PromiseResult) {
              try {
                var x = onrejected(PromiseResult);
                resolvePromise(promise, x, resolve, reject);
              } catch (error) {
                reject(error);
              }
            });
        }
      });
      return promise;

      // 根据状态的不同执行不同的状态
      // + 执行then的时候，哪怕已经知道状态了，也不是立即把onfulfilled/onrejected执行的，需要把函数的执行设置为异步操作：设置应该定时器，不设置等待的时间，则默认是浏览器最快反应时间执行，但是本身属于异步操作
      // + 执行then的时候，还不知道实例的状态（executor函数是一个异步操作）此刻我们应该先把基于then传入的方法onfulfilled/onrejected存起来,在以后执行resolve/reject函数的时候，通知方法执行！
      // switch (self.PromiseState) {
      //   case "fulfilled":
      //     setTimeout(function () {
      //       onfulfilled(self.PromiseResult);
      //     });
      //     break;
      //   case "rejected":
      //     setTimeout(function () {
      //       onrejected(self.PromiseResult);
      //     });
      //     break;
      //   default:
      //     //  存方法
      //     self.onFULFILLEDCallback.push(onfulfilled);
      //     self.onREJECTEDCallback.push(onrejected);
      // }
    },
    catch: function (onrejected) {
      var self = this;
      return self.then(null, onrejected);
    },
  };

  // 成功
  Promise.resolve = function resolve(value) {
    return new Promise(function (resolve, _) {
      resolve(value);
    });
  };
  // 失败
  Promise.reject = function reject(value) {
    return new Promise(function (_, reject) {
      reject(value);
    });
  };

  // 多个promise实例
  Promise.all = function all(arr) {
    return new Promise(function (resolve, reject) {
      var index = 0,
        results = [];

      for (var i = 0; i < arr.length; i++) {
        (function (i) {
          var item = arr[i];
          if (!(item instanceof Promise)) {
            index++;
            results[i] = item;
          } else {
            item
              .then(function (result) {
                index++;
                results[i] = result;
                if (index === arr.length) {
                  resolve(results);
                }
              })
              .catch(function (reason) {
                reject(reason);
              });
          }
        })(i);
      }
    });
  };

  // 哪个结果获得的快，就返回那个结果
  Promise.race = function race(all) {
    return new Promise((resolve, reject) => {
      all.map((promise) => {
        promise.then((value) => {
          resolve(value);
        });
      });
    });
  };

  window.Promise = Promise;
})();

var p1 = new Promise((resolve, reject) => {
  setTimeout(function () {
    resolve("OK");
    console.log(666);
  }, 1000);
  // reject("NO");
});

p1.then(
  (value) => {
    console.log(value);
  },
  (reqason) => {
    console.log(reqason);
  }
);

console.log(333);
