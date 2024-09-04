
// ParallelCallbackHandler is like JS Promise class, only one that takes
// several callbacks (to manipulate some data asynchronously), executes them
// all in one go, and then waits to call only one .then() callback
// (finalCallback) once these callbacks have all resolved.
// Usage: Make an callbackHandler instance, then push some callbacks, together
// with a key, that all ultimately ends in a call to either
// callbackHandler.resolve(key) or callbackHandler.resolve(reject). Then
// call callbackHandler.executeThen(finalCallback) to fire off the callbacks.
// When all callbacks are resolved, a call to finalCallback("success") is made.
// But if one is rejected a call to finalCallback("failure", key) is made
// instead, where key is the key of the failed callback.
export class ParallelCallbackHandler {
  constructor() {
    this.callbackArr = [];
    this.isReadyArr = [];
    this.finalCallback = null;
  }

  resolve(ind) {
    this.isReadyArr[ind] = true;
    let isReady = this.isReadyArr.reduce(
      (acc, val) => acc && val,
      true
    );
    if (isReady) {
      this.finalCallback("success");
    }
  }

  reject(msg, ind) {
    this.finalCallback("failure", msg, ind, this.callbackArr[ind]);
  }

  push(callback) {
    this.callbackArr.push(callback);
  }

  execAndThen(finalCallback) {
    this.isReadyArr = this.callbackArr.map(() => false);
    this.finalCallback = finalCallback ?? void(0);
    Object.values(this.callbackArr).forEach((callback, ind) => {
      let resolve = () => this.resolve(ind);
      let reject = (msg) => this.reject(msg, ind);
      callback(resolve, reject);
    });

  }

}


