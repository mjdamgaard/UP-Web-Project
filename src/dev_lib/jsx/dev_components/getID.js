


const idMap = new Map();
let nonce = 1;

export function getID(key) {
  let ret = idMap.get(key);
  if (ret === undefined) {
    ret = (nonce++).toString();
    idMap.set(key, ret);
  }
  return ret;
}

