(function () {
  // 自己实现一个Promise类，实现内置Promise的重写(PromiseAplus)
  // https://promisesaplus.com/
  function Promise() {}

  window.Promise = Promise;
})();
