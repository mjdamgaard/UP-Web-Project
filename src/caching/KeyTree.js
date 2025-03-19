

// TODO: At some point implement that node keys can have lengths greater than
// just char (and then propagate this parameter up through the cache classes).


class _KeyTree {

  constructor(parent = undefined, charPos = 0) {
    this.parent = parent;
    this.charPos = charPos;
    this.leafs = new Map();
    this.childTrees = new Map();
  }

  get(key) {
    key = key.toString();
    return this.#get(key, key.length - 1);
  }

  #get(key, keyMaxPos) {
    let char = key[this.charPos];
    let child;
    if (keyMaxPos <= this.charPos) {
      return this.leafs.get(char);
    }
    else if (child = this.childTrees.get(char)) {
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
      let prevVal = this.leafs.get(char);
      let didExist = (prevVal !== undefined);
      let newVal;
      if (updateCallback && didExist) {
        newVal = updateCallback(prevVal);
      }
      this.leafs.set(char, newVal ?? prevVal);
      return didExist;
    }
    else if (child = this.childTrees.get(char)) {
      return child.#set(key, val, keyMaxPos);
    }
    else {
      this.childTrees.set(char, child = new _KeyTree(this, this.charPos + 1));
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
      let prevVal = this.leafs.get(char);
      wasRemoved = (prevVal !== undefined);
      if (removeCallback && wasRemoved) {
        removeCallback(prevVal);
      }
      this.leafs.delete(char);
    }
    else if (child = this.childTrees.get(char)) {
      wasRemoved = child.#remove(key, keyMaxPos);
    }
    else {
      return false;
    }

    if (
      wasRemoved && this.parent &&
      this.leafs.size === 0 &&
      this.childTrees.size === 0
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




export class KeyTree extends _KeyTree {

  constructor() {
    super();
  }
}


export {KeyTree as default};
