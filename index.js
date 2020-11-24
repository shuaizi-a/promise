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
        for (let i = 0; i < arr.length; i++) {
          let itemFUNC = arr[i];
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

  // promise原型上应该有then这个方法
  Promise.prototype = {
    customize: true, // 代表是我自己写的不是内置类
    constructor: Promise,
    then: function (onfulfilled, onrejected) {
      var self = this;

      // 根据状态的不同执行不同的状态
      // + 执行then的时候，哪怕已经知道状态了，也不是立即把onfulfilled/onrejected执行的，需要把函数的执行设置为异步操作：设置应该定时器，不设置等待的时间，则默认是浏览器最快反应时间执行，但是本身属于异步操作
      // + 执行then的时候，还不知道实例的状态（executor函数是一个异步操作）此刻我们应该先把基于then传入的方法onfulfilled/onrejected存起来,在以后执行resolve/reject函数的时候，通知方法执行！
      switch (self.PromiseState) {
        case "fulfilled":
          setTimeout(function () {
            onfulfilled(self.PromiseResult);
          });
          break;
        case "rejected":
          setTimeout(function () {
            onrejected(self.PromiseResult);
          });
          break;
        default:
          //  存方法
          self.onFULFILLEDCallback.push(onfulfilled);
          self.onREJECTEDCallback.push(onrejected);
      }
    },
    catch: function (onrejected) {
      var self = this;
      switch (self.PromiseState) {
        case "rejected":
          setTimeout(function () {
            onrejected(self.PromiseResult);
          });
          break;
      }
    },
  };

  window.Promise = Promise;
})();

let p1 = new Promise((resolve, reject) => {
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
p1.then(
  (value) => {
    console.log(value);
  },
  (reqason) => {
    console.log(reqason);
  }
);
p1.then(
  (value) => {
    console.log(value);
  },
  (reqason) => {
    console.log(reqason);
  }
);
console.log(333);
