

class _IDTree {

  constructor(parent = undefined, charPos = 0) {
    this.parent = parent;
    this.charPos = charPos;
    this.leafs = {};
    this.childTrees = {};
  }

  get(key) {
    key = key.toString();
    return this.#get(key, key.length - 1);
  }

  #get(key, keyMaxPos) {
    let char = key[this.charPos];
    let child;
    if (keyMaxPos <= this.charPos) {
      return this.leafs[char];
    }
    else if (child = this.childTrees[char]) {
      return child.#get(key, keyMaxPos);
    }
    else {
      return undefined;
    }
  }


  set(key, val, updateCallback = undefined) {
    key = key.toString();
    return this.#set(key, val, key.length - 1, updateCallback);
  }

  #set(key, val, keyMaxPos, updateCallback) {
    let char = key[this.charPos];
    let child;
    if (keyMaxPos <= this.charPos) {
      let prevVal = this.leafs[char];
      let didExist = (prevVal !== undefined);
      let newVal;
      if (updateCallback && didExist) {
        newVal = updateCallback(prevVal);
      }
      this.leafs[char] = newVal ?? prevVal;
      return didExist;
    }
    else if (child = this.childTrees[char]) {
      return child.#set(key, val, keyMaxPos);
    }
    else {
      this.childTrees[char] = child = new _IDTree(this, this.charPos + 1);
      return child.#set(key, val, keyMaxPos);
    }
  }


  remove(key, removeCallback) {
    key = key.toString();
    return this.#remove(key, key.length - 1, removeCallback);
  }

  #remove(key, keyMaxPos, removeCallback) {
    let char = key[this.charPos];
    let child, wasRemoved;
    if (keyMaxPos <= this.charPos) {
      let prevVal = this.leafs[char];
      wasRemoved = (prevVal !== undefined);
      if (updateCallback && didExist) {
        removeCallback(prevVal);
      }
      delete this.leafs[char];
    }
    else if (child = this.childTrees[char]) {
      wasRemoved = child.#remove(key, keyMaxPos);
    }
    else {
      return false;
    }

    if (
      wasRemoved && this.parent &&
      Object.keys(this.leafs).length === 0 &&
      Object.keys(this.childTrees).length === 0
    ) {
      let ownKey = key.substring(0, this.charPos);
      this.parent.remove(ownKey);
    }
    return wasRemoved;
  }


  forEach(callback) {
    let i = [0];
    this.#forEach(callback, i);
  }

  #forEach(callback, i) {
    this.leafs.forEach(val => callback(val, i[0]++));
    this.childTrees.forEach(node => node.#forEach(callback, i));
  }

}




export class IDTree extends _IDTree {

  constructor() {
    super();
  }
}


export {IDTree as default};
