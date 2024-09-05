
// ParallelCallbackHandler is like JS Promise class, only one that takes
// several callbacks (to manipulate some data asynchronously), executes them
// all in one go, and then waits to call only one .then() callback
// (finalCallback) once these callbacks have all resolved.
// Usage: Make an callbackHandler instance, then push some callbacks that all
// ultimately ends in a call resolve or reject, which are the two inputs of
// these callbacks. Then call callbackHandler.execAndThen(finalCallback) to
// fire off all these initial callbacks. When all callbacks are resolved, a
// call to finalCallback("success") is made. But if one is rejected a call to
// finalCallback("failure", msg) is made instead, where msg is the input of the
// given reject() function. 
export class ParallelCallbackHandler {
  constructor() {
    this.callbackArr = [];
    this.isReadyArr = [];
    this.finalCallback = null;
  }

  push(callback) {
    this.callbackArr.push(callback);
  }

  execAndThen(finalCallback) {
    this.finalCallback = finalCallback ?? void(0);
    // If no callbacks have been pushed, call finalCallback right away.
    if (this.callbackArr.length === 0) {
      this.finalCallback("success");
      return;
    }
    // Else call each callback, and give them each distinct resolve and reject
    // functions as inputs.
    this.isReadyArr = Array(this.callbackArr.length).fill(false);
    Object.values(this.callbackArr).forEach((callback, ind) => {
      let resolve = () => this.#resolve(ind);
      let reject = (msg) => this.#reject(msg, ind);
      callback(resolve, reject);
    });
  }


  #resolve(ind) {
    // If all callbacks have called their resolve function, call finalCallback.
    this.isReadyArr[ind] = true;
    let isReady = this.isReadyArr.reduce(
      (acc, val) => acc && val,
      true
    );
    if (isReady) {
      this.finalCallback("success");
    }
  }

  #reject(msg, ind) {
    this.finalCallback("failure", msg, ind, this.callbackArr[ind]);
  }

}


