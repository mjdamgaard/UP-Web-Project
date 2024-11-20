



export class LazyCallbackHandler {

  constructor(delay) {
    this.delay = delay;
    this.nonce = 0;
  }
  
  then(callback) {
    this.nonce++;
    let newNonce = this.nonce;
    setTimeout(
      () => {
        if (this.nonce === newNonce) {
          callback();
        }
      },
      this.delay
    );
  }
}


// export class LazyDelayedPromise {

//   constructor(delay, isReady) {
//     this.delay = delay;
//     this.isReady = isReady ?? false;
//     this.callbackArr = [];
//   }
  
//   then(callback) {
//     this.callbackArr.push(callback);
//     if (this.isReady) {
//       this.isReady = false;
//       let lastCallback = this.callbackArr.pop()();
//       this.callbackArr = [];
//       lastCallback();
//       sleep(this.delay).then(() => {
//         if (!this.isReady) {
//           this.isReady = true;
//         }
//       });
//     }
//     else {
//       sleep(this.delay).then(() => {
//         if (this.callbackArr.length > 0 && this.isReady) {
//           this.isReady = false;
//           let lastCallback = this.callbackArr.pop()();
//           this.callbackArr = [];
//           lastCallback();
//         }
//       })
//     }
//   }
// }