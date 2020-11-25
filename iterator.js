// 遍历器
class Interator {
  constructor(arr) {
    this.arr = arr;
    this.index = 0;
    this.next = function () {
      if (this.index > this.arr.length - 1) {
        return {
          done: true,
          value: undefined,
        };
      }
      return {
        done: true,
        value: this.arr[this.index++],
      };
    };
  }

  static add() {}

  nexttow() {
    if (this.index > this.arr.length - 1) {
      return {
        done: true,
        value: undefined,
      };
    }
    return {
      done: true,
      value: this.arr[this.index++],
    };
  }
}

let arr = [10, 20, 30];
let itor = new Interator(arr);
console.log(itor.next());
console.log(itor.next());
console.log(itor.next());
console.log(itor.next());

console.dir(Interator);

// 遍历器
Object.prototype[Symbol.iterator] = function () {
  console.log(...Object.getOwnPropertyNames(this));
  console.log(...Object.getOwnPropertySymbols(this));
  let self = this,
    keys = [
      ...Object.getOwnPropertyNames(self),
      ...Object.getOwnPropertySymbols(self),
    ],
    index = 0;
  return {
    next() {
      if (index > keys.length - 1) {
        return {
          done: true,
          value: undefined,
        };
      }
      return {
        done: false,
        value: self[keys[index++]],
      };
    },
  };
};

let obj = {
  0: 10,
  1: 20,
  2: 30,
  3: 40,
};

// Objent不能直接用for...of遍历，缺少Symbol.iterator
for (let item of obj) {
  console.log(item);
}

// 生成器
// https://blog.csdn.net/hot_cool/article/details/84250013
