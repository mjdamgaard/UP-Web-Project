
import {
  DevFunction, getString, ArgTypeError, forEachValue, getPropertyFromObject,
} from '../interpreting/ScriptInterpreter.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const NULL_CHAR_REGEX = /\0/;
const LEADING_ZERO_PAIRS_REGEX = /^(00)+/;
const INTEGER_TYPE_REGEX = /^(u)?int(\([1-9][0-9]*\))?$/;
const FLOAT_TYPE_REGEX =
  /^float\(([0-9.E+\-]+) *, *([0-9.E+\-]+) *(, *([1-9][0-9]*))? *\)$/;

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
  "arrayToBase64", {typeArr: ["array", "array"]},
  function({callerNode, execEnv}, [valArr, typeArr]) {
    // Initialize an array and then push to it each Uint8Array generated from
    // converting a value from valArr into a binary array according to the
    // specified type. The binary representations of the values seeks to be
    // compact, first of all, but also importantly seeks to be such that the
    // collation of the given type works as expected. For instance, since
    // an signed integer of -5 is less than one of 5, -5 should get a binary
    // representation with a lower numeric value of the two.   
    let binArrArr = [];
    forEachValue(typeArr, callerNode, execEnv, (type, ind) => {
      type = getString(type, callerNode, execEnv);
      let val = getPropertyFromObject(valArr, ind);
      let match, isUnsigned, lenExp, loExp, hiExp;

      // If type = 'string', treat val as a string of variable length.
      if (type === "string") {
        val = getString(val, callerNode, execEnv);
        if (NULL_CHAR_REGEX.test(val)) throw new ArgTypeError(
          `Cannot convert a string containing a null character: ${val}`,
          callerNode, execEnv
        );
        let binArr = textEncoder.encode(val + "\0");
        binArrArr.push(binArr);
        return;
      }

      // If type = 'hex-int', treat val as a hexadecimal string of variable
      // length. We remove any leading pairs of zeros automatically, and
      // instead prepend the length of the hex string divided by 2 so that hex
      // strings are thus collated w.r.t. their numerical values.
      if (type === "hex-int") {
        let initVal = getString(val, callerNode, execEnv);
        val = initVal.replace(LEADING_ZERO_PAIRS_REGEX, "");
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
              `Invalid hexadecimal string: ${initVal}`,
              callerNode, execEnv
            );
          }
        }
        binArrArr.push(binArr);
        return;
      }

      // If type = '[u]int[(len)]', treat val as an integer of len bytes.
      [match, isUnsigned, lenExp] = type.match(INTEGER_TYPE_REGEX) ?? [];
      if (match) {
        let initVal = val;
        val = parseInt(initVal);
        if (Number.isNaN(val)) throw new ArgTypeError(
          "Cannot convert a non-integer to a uint type: " +
          getString(initVal, callerNode, execEnv),
          callerNode, execEnv
        );
        let len = parseInt(lenExp ? lenExp.slice(1, -1) : 4);
        if (Number.isNaN(len) || len < 1 || len > 6) throw new ArgTypeError(
          "Integer byte length needs to be between 1 and 6, but got: " + len,
          callerNode, execEnv
        );
        // If the integer is signed, add |minInt| to translate the minInt-
        // maxInt range into the 0-maxUInt range.
        if (!isUnsigned) {
          val = val - minInts[len - 1];
        }
        if (val < 0 || val > maxUInts[len - 1]) throw new ArgTypeError(
          "Invalid " + type + ": " + getString(initVal, callerNode, execEnv),
          callerNode, execEnv
        );
        let hexStr = val.toString(16).padStart(len * 2, "0");
        let binArr = Uint8Array.fromHex(hexStr);
        binArrArr.push(binArr);
        return;
      }

      // If type = 'float(lo, hi[, len])', treat val as an floating-point number
      // of len bytes (determining the precision) in the range between lo and
      // hi.
      [match, loExp, hiExp, lenExp] = type.match(FLOAT_TYPE_REGEX) ?? [];
      if (match) {
        let initVal = val;
        val = parseFloat(initVal);
        if (Number.isNaN(val)) throw new ArgTypeError(
          "Cannot convert a non-float to a float type: " +
          getString(initVal, callerNode, execEnv),
          callerNode, execEnv
        );
        let len = parseInt(lenExp ? lenExp.substring(1) : 4);
        if (Number.isNaN(len) || len < 1 || len > 6) throw new ArgTypeError(
          "Float byte length needs to be between 1 and 6, but got: " +
          lenExp.substring(1),
          callerNode, execEnv
        );
        let lo = parseFloat(loExp);
        let hi = parseFloat(hiExp);
        if (Number.isNaN(lo) || Number.isNaN(hi)) throw new ArgTypeError(
          "Invalid float limit: " + (Number.isNaN(lo) ? loExp : hiExp),
          callerNode, execEnv
        );
        if (lo >= hi || val < lo || val > hi) throw new ArgTypeError(
          `Float value needs to be inside limits: ${loExp} <= ${val} <= ` +
          hiExp,
          callerNode, execEnv
        );
        let n = parseInt((val - lo) * maxUInts[len - 1] / (hi - lo));
        let hexStr = n.toString(16).padStart(len * 2, "0");
        let binArr = Uint8Array.fromHex(hexStr);
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
    return combBinArray.toBase64({alphabet: "base64url"});
  }
);




export const arrayFromBase64 = new DevFunction(
  "arrayFromBase64", {typeArr: ["string", "array"]},
  function({callerNode, execEnv}, [base64Str, typeArr]) {
    let valArr = [];
    let combBinArr;
    let accLen = 0;
    try {
      combBinArr = Uint8Array.fromBase64(base64Str, {alphabet: "base64url"});
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
    forEachValue(typeArr, callerNode, execEnv, (type, ind) => {
      type = getString(type, callerNode, execEnv);
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

      // Reverse conversion for the 'hex-int' type.
      if (type === "hex-int") {
        let len = combBinArr[accLen];
        let newLen = accLen + 1 + len;
        if (len < 1 || newLen > combLen) throw new ArgTypeError(
          `Invalid hexadecimal string encoding: ${base64Str} at index ${ind}`,
          callerNode, execEnv
        );
        if (newLen> combBinArr.length) throw new ArgTypeError(
          "End of the base 64 string was reached before all array entries " +
          "was converted",
          callerNode, execEnv
        );
        let binArr = combBinArr.slice(accLen + 1, newLen);
        let hexStr = binArr.toHex();
        if (hexStr[0] === "0") {
          hexStr = hexStr.substring(1);
        } 
        valArr.push(hexStr);
        accLen = newLen;
        return;
      }

      // Reverse conversion for the '[u]int[(len)]' type.
      [match, isUnsigned, lenExp] = type.match(INTEGER_TYPE_REGEX) ?? [];
      if (match) {
        let len = parseInt(lenExp ? lenExp.slice(1, -1) : 4);
        if (Number.isNaN(len) || len < 1 || len > 6) throw new ArgTypeError(
          "Integer byte length needs to be between 1 and 6, but got: " + len,
          callerNode, execEnv
        );
        if (accLen + len > combBinArr.length) throw new ArgTypeError(
          "End of the base 64 string was reached before all array entries " +
          "was converted",
          callerNode, execEnv
        );
        let binArr = combBinArr.slice(accLen, accLen + len);
        let n = parseInt(binArr.toHex(), 16);

        // If the int is signed, subtract the |minInt| again.
        if (!isUnsigned) {
          n = n + minInts[len - 1];
        }
        valArr.push(n);
        accLen = accLen + len;
        return;
      }

      // If type = 'float(lo, hi[, len])', treat val as an floating-point number
      // of len bytes (determining the precision) in the range between lo and
      // hi.
      [match, loExp, hiExp, lenExp] = type.match(FLOAT_TYPE_REGEX) ?? [];
      if (match) {
        let len = parseInt(lenExp ? lenExp.substring(1) : 4);
        if (Number.isNaN(len) || len < 1 || len > 6) throw new ArgTypeError(
          "Float byte length needs to be between 1 and 6, but got: " +
          lenExp.substring(1),
          callerNode, execEnv
        );
        if (accLen + len > combBinArr.length) throw new ArgTypeError(
          "End of the base 64 string was reached before all array entries " +
          "was converted",
          callerNode, execEnv
        );
        let binArr = combBinArr.slice(accLen, accLen + len);
        let n = parseInt(binArr.toHex(), 16);

        let lo = parseFloat(loExp);
        let hi = parseFloat(hiExp);
        if (Number.isNaN(lo) || Number.isNaN(hi)) throw new ArgTypeError(
          "Invalid float limit: " + (Number.isNaN(lo) ? loExp : hiExp),
          callerNode, execEnv
        );
        if (lo >= hi) throw new ArgTypeError(
          `Invalid float limits: ${loExp} < ${hiExp}`,
          callerNode, execEnv
        );
        let x = lo + (hi - lo) * n / maxUInts[len - 1];
        
        valArr.push(x);
        accLen = accLen + len;
        return;
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










export const hexFromBase64 = new DevFunction(
  "hexFromBase64", {typeArr: ["string"]},
  function({callerNode, execEnv}, [base64Str]) {
    let ret;
    try {
      ret = Uint8Array.fromBase64(base64Str, {alphabet: "base64url"}).toHex();
    }
    catch (err) {
      if (err instanceof TypeError) {
        throw new ArgTypeError(
          `Invalid base 64 string: ${base64Str}`,
          callerNode, execEnv
        );
      }
    }
    return ret;
  }
);



export const hexToBase64 = new DevFunction(
  "hexToBase64", {typeArr: ["string"]},
  function({callerNode, execEnv}, [hexStr]) {
    let ret;
    try {
      ret = Uint8Array.fromHex(hexStr).toBase64({alphabet: "base64url"});
    }
    catch (err) {
      if (err instanceof TypeError) {
        throw new ArgTypeError(
          `Invalid hexadecimal string: ${hexStr}`,
          callerNode, execEnv
        );
      }
    }
    return ret;
  }
);