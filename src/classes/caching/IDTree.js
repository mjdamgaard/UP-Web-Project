

class _IDTree {

  constructor(parent = undefined, charPos = 0) {
    this.parent = parent;
    this.charPos = charPos;
    this.leafs = {};
    this.childTrees = {};
  }

  get(key) {
    key = key.toString();
    return this._get(key, key.length - 1);
  }

  _get(key, keyMaxPos) {
    let char = key[this.charPos];
    let child;
    if (keyMaxPos <= this.charPos) {
      return this.leafs[char];
    }
    else if (child = this.childTrees[char]) {
      return child._get(key, keyMaxPos);
    }
    else {
      return undefined;
    }
  }


  set(key, val) {
    key = key.toString();
    return this._set(key, val, key.length - 1);
  }

  _set(key, val, keyMaxPos) {
    let char = key[this.charPos];
    let child;
    if (keyMaxPos <= this.charPos) {
      this.leafs[char] = val;
    }
    else if (child = this.childTrees[char]) {
      return child._set(key, val, keyMaxPos);
    }
    else {
      this.childTrees[char] = child = new _IDTree(this, this.charPos + 1);
      child._set(key, val, keyMaxPos);
    }
  }


  remove(key) {
    key = key.toString();
    return this._remove(key, key.length - 1);
  }

  _remove(key, keyMaxPos) {
    let char = key[this.charPos];
    let child, wasRemoved;
    if (keyMaxPos <= this.charPos) {
      wasRemoved = this.leafs[char];
      delete this.leafs[char];
    }
    else if (child = this.childTrees[char]) {
      wasRemoved = child._remove(key, keyMaxPos);
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
    this._forEach(callback, i);
  }

  _forEach(callback, i) {
    this.leafs.forEach(val => callback(val, i[0]++));
    this.childTrees.forEach(node => node._forEach(callback, i));
  }

}




export class IDTree extends _IDTree {

  constructor() {
    super();
  }
}


export {IDTree as default};
