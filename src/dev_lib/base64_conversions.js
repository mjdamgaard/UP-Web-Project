
import {
  DevFunction, TypeError, forEach, toString, getEntry, ArgTypeError
} from '../interpreting/ScriptInterpreter.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const NULL_CHAR_REGEX = /\0/;
const LEADING_ZERO_PAIRS_REGEX = /^(00)+/;
const INTEGER_TYPE_REGEX = /^(u)?int(\([1-9][0-9]*\))?$/;
const FLOAT_TYPE_REGEX =
  /^float\(([0-9.E+\-]+),([0-9.E+\-]+)(,([1-9][0-9]*))?\)$/;

const maxUInts = [
  255,
  65535,
  16777215,
  4294967295,
  1099511627775,
  281474976710655,
];
const minInts = [
  -128,
  -32768,
  -8388608,
  -2147483648,
  -549755813888,
  -140737488355328,
];


export const arrayToBase64 = new DevFunction(
  {},
  function(
    {callerNode, execEnv},
    [valArr, typeArr]
  ) {
    // Initialize an array and then push to it each Uint8Array generated from
    // converting a value from valArr into a binary array according to the
    // specified type. The binary representations of the values seeks to be
    // compact, first of all, but also importantly seeks to be such that the
    // collation of the given type works as expected. For instance, since
    // an signed integer of -5 is less than one of 5, -5 should get a binary
    // representation with a lower numeric value of the two.   
    let binArrArr = [];
    forEach(typeArr, type => {
      type = toString(type, ind);
      let match, isUnsigned, lenExp, loExp, hiExp;

      // If type = 'string', treat val as a string of variable length.
      if (type === "string") {
        let val = toString(getEntry(valArr, ind));
        if (NULL_CHAR_REGEX.test(val)) throw new ArgTypeError(
          `Cannot convert a string containing a null character: ${val}`,
          callerNode, execEnv
        );
        let binArr = textEncoder.encode(val + "\0");
        binArrArr.push(binArr);
        return;
      }

      // If type = 'hex', treat val as a hexadecimal string of variable length.
      // We remove any leading pairs of zeros automatically, and instead
      // prepend the length of the hex string divided by 2 so that hex strings
      // are thus collated w.r.t. their numerical values.
      if (type === "hex") {
        let val = toString(getEntry(valArr, ind));
        val = val.replace(LEADING_ZERO_PAIRS_REGEX, "");
        if (val === "") val = "00";
        let len = val.length / 2;
        if (!Number.isInteger(len)) {
          val = "0" + val;
          len = Math.ceil(len);
        }
        if (len > 255) throw new ArgTypeError(
          `Too long hexadecimal string: ${val}`,
          callerNode, execEnv
        );
        let binArr;
        let transformedHexStr = len.toString(16).padStart(2, "0") + val;
        try {
          binArr = Uint8Array.fromHex(transformedHexStr);
        }
        catch (err) {
          if (err instanceof TypeError || err instanceof SyntaxError) {
            throw new ArgTypeError(
              `Invalid hexadecimal string: ${val}`,
              callerNode, execEnv
            );
          }
        }
        binArrArr.push(binArr);
        return;
      }

      // If type = '[u]int[(len)]', treat val as an integer of len bytes.
      [match, isUnsigned, lenExp] = type.match(INTEGER_TYPE_REGEX);
      if (match) {
        let valExp = getEntry(valArr, ind);
        let val = parseInt(valExp);
        if (val === NaN) throw new ArgTypeError(
          `Cannot convert a non-integer to a uint type: ${valExp}`,
          callerNode, execEnv
        );
        let len = parseInt(lenExp ? lenExp.slice(1, -1) : 4);
        if (len === NaN || len < 1 || len > 6) throw new ArgTypeError(
          "Integer byte length needs to be between 1 and 6, but got: " +
          lenExp.slice(1, -1),
          callerNode, execEnv
        );
        // If the integer is signed, add |minInt| to translate the minInt-
        // maxInt range into the 0-maxUInt range.
        if (!isUnsigned) {
          val = val - minInts[len - 1];
        } 
        let binArr = new Uint8Array(getBytes(val, len, callerNode, execEnv));
        binArrArr.push(binArr);
        return;
      }

      // If type = 'float(lo, hi[, len])', treat val as an floating-point number
      // of len bytes (determining the precision) in the range between lo and
      // hi.
      [match, loExp, hiExp, lenExp] = type.match(FLOAT_TYPE_REGEX);
      if (match) {
        let valExp = getEntry(valArr, ind);
        let val = parseInt(valExp);
        if (val === NaN) throw new ArgTypeError(
          `Cannot convert a non-float to a float type: ${valExp}`,
          callerNode, execEnv
        );
        let len = parseInt(lenExp ? lenExp.substring(1) : 4);
        if (len === NaN || len < 1 || len > 6) throw new ArgTypeError(
          "Float byte length needs to be between 1 and 6, but got: " +
          lenExp.substring(1),
          callerNode, execEnv
        );
        let lo = parseFloat(loExp);
        let hi = parseFloat(hiExp);
        if (lo === NaN || hi === NaN) throw new ArgTypeError(
          "Invalid float limit: " + (lo === NaN ? loExp : hiExp),
          callerNode, execEnv
        );
        if (val < lo || val >= hi) throw new ArgTypeError(
          `Float value needs to be inside limits: ${loExp} <= ${valExp} < ` +
          hiExp,
          callerNode, execEnv
        );
        let n = parseInt((val - lo) * maxUInts[len - 1] / (hi - lo));
        let binArr = new Uint8Array(getBytes(n, len, callerNode, execEnv));
        binArrArr.push(binArr);
        return;
      }

      // If code reaches here, throw an 'unrecognized type' error.
      throw new ArgTypeError(
        `Unrecognized type: ${type}`,
        callerNode, execEnv
      );
    });

    // Finally concat binArrArr and convert the resulting Uint8Array into a
    // base-64 string.
    let combLen = binArrArr.reduce(
      (accLen, binArr) => accLen + binArr.length,
      0
    );
    let combBinArray = new Uint8Array(combLen);
    binArrArr.reduce(
      (accLen, binArr) => {
        combBinArray.set(binArr, accLen);
        return accLen + binArr.length;
      },
      0
    );
    return combBinArray.toBase64("base64url");
  }
);




export const arrayFromBase64 = new DevFunction(
  {},
  function(
    {callerNode, execEnv},
    [base64Str, typeArr]
  ) {
    let valArr = [];
    let combBinArr;
    let accLen = 0;
    try {
      combBinArr = Uint8Array.fromBase64(base64Str, "base64url");
    }
    catch (err) {
      if (err instanceof TypeError || err instanceof SyntaxError) {
        throw new ArgTypeError(
          `Invalid base 64 string: ${base64Str}`,
          callerNode, execEnv
        );
      }
    }
    let combLen = combBinArr.length;
    forEach(typeArr, type => {
      type = toString(type, ind);
      let match, isUnsigned, lenExp, loExp, hiExp;

      // Reverse conversion for the 'string' type.
      if (type === "string") {
        let indOfNullChar = combBinArr.indexOf(0, accLen);
        if (indOfNullChar === -1) {
          throw new ArgTypeError(
            "Invalid string encoding that does not end in a null character: " +
            `${base64Str} at index ${ind}`,
            callerNode, execEnv
          );
        }
        let val;
        try {
          val = textDecoder.decode(combBinArr.slice(accLen, indOfNullChar))
        }
        catch (err) {
          if (err instanceof TypeError) {
            throw new ArgTypeError(
              `Invalid UFT-8 string encoding: ${base64Str} at index ${ind}`,
              callerNode, execEnv
            );
          }
        }
        valArr.push(val);
        accLen = indOfNullChar + 1;
        return;
      }

      // Reverse conversion for the 'hex[(len)]' type.
      if (type === "hex") {
        let len = combBinArr[accLen];
        let newLen = accLen + 1 + len;
        if (len < 1 || newLen > combLen) throw new ArgTypeError(
          `Invalid hexadecimal string encoding: ${base64Str} at index ${ind}`,
          callerNode, execEnv
        );
        let binArr = combBinArr.slice(accLen + 1, newLen);
        valArr.push(binArr.toHex());
        accLen = newLen;
        return;
      }

      // Reverse conversion for the '[u]int[(len)]' type.
      [match, isUnsigned, lenExp] = type.match(INTEGER_TYPE_REGEX);
      if (match) {
        let len = parseInt(lenExp ? lenExp.slice(1, -1) : 4);
        if (len === NaN || len < 1 || len > 6) throw new ArgTypeError(
          "Integer byte length needs to be between 1 and 6, but got: " +
          lenExp.slice(1, -1),
          callerNode, execEnv
        );
        let binArr = combBinArr.slice(accLen, accLen + len);
        let n = getNum(binArr);

        // If the int is signed, subtract the |minInt| again.
        if (!isUnsigned) {
          n = n + minInts[len - 1];
        }
        valArr.push(n);
        accLen = accLen + len;
      }

      // If type = 'float(lo, hi[, len])', treat val as an floating-point number
      // of len bytes (determining the precision) in the range between lo and
      // hi.
      [match, loExp, hiExp, lenExp] = type.match(FLOAT_TYPE_REGEX);
      if (match) {
        let len = parseInt(lenExp ? lenExp.slice(1, -1) : 4);
        if (len === NaN || len < 1 || len > 6) throw new ArgTypeError(
          "Integer byte length needs to be between 1 and 6, but got: " +
          lenExp.slice(1, -1),
          callerNode, execEnv
        );
        let binArr = combBinArr.slice(accLen, accLen + len);
        let n = getNum(binArr);

        let lo = parseFloat(loExp);
        let hi = parseFloat(hiExp);
        if (lo === NaN || hi === NaN) throw new ArgTypeError(
          "Invalid float limit: " + (lo === NaN ? loExp : hiExp),
          callerNode, execEnv
        );
        if (lo >= hi) throw new ArgTypeError(
          `Invalid float limits: ${loExp} < ${hiExp}`,
          callerNode, execEnv
        );
        let x = lo + (hi - lo) * n / maxUInts[len - 1];
        
        valArr.push(x);
        accLen = accLen + len;
      }

      // If code reaches here, throw an 'unrecognized type' error.
      throw new ArgTypeError(
        `Unrecognized type: ${type}`,
        callerNode, execEnv
      );
    });

    return valArr;
  }
);







function getBytes(n, len, node, env) {
  let reverseByteArr = [];
  try {
    getBytesHelper(n, len, reverseByteArr);
  }
  catch (err) {
    if (err instanceof ArgTypeError) {
      err.val = `Integer ${n} exceeds maximum value of ${maxUInts[len - 1]}`;
      err.node = node;
      err.environment = env;
    }
  }
  return reverseByteArr.reverse();
}

function getBytesHelper(n, len, reverseByteArr) {
  if (len <= 0) {
    if (n > 0) throw new ArgTypeError();
    return;
  };
  let nextN = n >> 8;
  let byte = n - nextN << 8;
  reverseByteArr.push(byte);
  getBytesHelper(nextN, len, reverseByteArr);
}



function getNum(bytes) {
  let reverseByteArr = bytes.toReverse();
  return reverseByteArr.reduce(
    (acc, val, ind) => acc + val * maxUInts[ind - 1]
  );
}
