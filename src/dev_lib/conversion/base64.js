
import {
  DevFunction, getString, ArgTypeError, forEachValue, getPropertyFromObject,
} from '../../interpreting/ScriptInterpreter.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const NULL_CHAR_REGEX = /\0/;
const LEADING_ZERO_PAIRS_REGEX = /^(00)+/;
const INTEGER_TYPE_REGEX = /^(u)?int(\([1-9][0-9]*\))?$/;
const FLOAT_TYPE_REGEX =
  /^float\( *([0-9.E+\-]+)?, *([0-9.E+\-]+)?, *([1-9][0-9]*) *\)$/;

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


// TODO: Apparently the methods of Uint8Array isn't widely supported in
// browsers, so see about how to use another library. ...Well, apparently it's
// an experimental feature in Chrome, so maybe it'll be fine.. ..Oh, Node.js
// doesn't support it natively.. ..But maybe it works with the uint8arrays
// package, I'll see.. ... Oh, and since you can also provide the inputArr with
// the postData for callSMF routes, it won't be too critical to have this
// library on the client side..



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
      type = getString(type, execEnv);
      let val = getPropertyFromObject(valArr, ind);
      let match, isUnsigned, lenExp, loExp, hiExp;

      // If type = 'string', treat val as a string of variable length.
      if (type === "string") {
        val = getString(val, execEnv);
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
        let initVal = getString(val, execEnv);
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
          getString(initVal, execEnv),
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
          "Invalid " + type + ": " + getString(initVal, execEnv),
          callerNode, execEnv
        );
        let hexStr = val.toString(16).padStart(len * 2, "0");
        let binArr = Uint8Array.fromHex(hexStr);
        binArrArr.push(binArr);
        return;
      }

      // If type = 'float(lo?,hi?,sigLen)', treat val as a floating-point
      // number with a precision of sigLen bytes (determining the precision)
      // in the range between lo and hi.
      [match, loExp, hiExp, lenExp] = type.match(FLOAT_TYPE_REGEX) ?? [];
      if (match) {
        let initVal = val;
        val = parseFloat(initVal);
        if (Number.isNaN(val)) throw new ArgTypeError(
          "Cannot convert a non-float to a float type: " +
          getString(initVal, execEnv),
          callerNode, execEnv
        );
        let len = parseInt(lenExp);
        if (Number.isNaN(len) || len < 1 || len > 6) throw new ArgTypeError(
          "Float byte length needs to be between 1 and 6, but got: " +
          lenExp.substring(1),
          callerNode, execEnv
        );
        let lo = parseFloat(loExp);
        let hi = parseFloat(hiExp);
        if (loExp && Number.isNaN(lo) || hiExp && Number.isNaN(hi)) {
          throw new ArgTypeError(
            "Invalid float limit: " + (Number.isNaN(lo) ? loExp : hiExp),
            callerNode, execEnv
          );
        }
        if (lo >= hi || val < lo || val > hi) throw new ArgTypeError(
          `Float value needs to be inside limits: ${loExp} <= ${val} <= ` +
          hiExp,
          callerNode, execEnv
        );

        // If both lo and hi is defined, we need no exponent, but only need to
        // store the a value between 0 and 1 with len precision.
        let hexStr;
        if (loExp && hiExp) {
          let n = Math.floor((val - lo) * maxUInts[len - 1] / (hi - lo));
          hexStr = n.toString(16).padStart(len * 2, "0");
        }

        // If only there's a lower limit, subtract that and store the resulting
        // float simply as an 8-bit exponent, followed by a len*8-bit 
        // significand. And if only there's an upper limit, do a similar thing,
        // but with negative values, and then negate all bit bitwise at the end.
        else if (loExp || hiExp) {
          val = loExp ? val - lo : hi - val;
          let exp = Math.floor(Math.log2(val));
          if (loExp && exp < -128 || hiExp && exp > 127) {
            hexStr = "00" + "00".repeat(len);
          }
          else if (loExp && exp > 127 || hiExp && exp < -128) {
            hexStr = "FF" + "FF".repeat(len);
          }
          else {
            let expHexStr = (exp + 128).toString(16).padStart(2, "0");
            let n = Math.floor((val / 2**(exp + 1)) * maxUInts[len - 1]);
            hexStr = expHexStr + n.toString(16).padStart(len * 2, "0");
            if (hiExp) hexStr = bitwiseNegateHexString(hexStr);
          }
        }

        // And if there is no limit, we only store a 7-bit exponent, and let
        // the first bit be the negated sign bit. And in case of a negative
        // val, 
        else {
          let absVal = (val < 0) ? -val : val; 
          let exp = Math.floor(Math.log2(absVal));
          if (exp < -64) {
            hexStr = (val >= 0) ?
              "80" + "00".repeat(len) : "7F" + "FF".repeat(len);
          }
          if (exp > 63) {
            hexStr = (val >= 0) ?
              "7F" + "FF".repeat(len) : "80" + "00".repeat(len);
          }
          else {
            let posSignExp = exp + 192;
            let posSignExpHexStr = posSignExp.toString(16).padStart(2, "0");
            let n = parseInt((absVal / 2**(exp + 1)) * maxUInts[len - 1]);
            hexStr = posSignExpHexStr + n.toString(16).padStart(len * 2, "0");
            if (val < 0) hexStr = bitwiseNegateHexString(hexStr);
          }
        }

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
    let accLen = 0;
    binArrArr.forEach(binArr => {
      combBinArray.set(binArr, accLen);
      accLen = accLen + binArr.length;
    });
    return combBinArray.toBase64({alphabet: "base64url"});
  }
);




export const arrayFromBase64 = new DevFunction(
  "arrayFromBase64", {typeArr: ["string", "array", "boolean?"]},
  function(
    {callerNode, execEnv}, [base64Str, typeArr, acceptIncomplete = false]
  ) {
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
      type = getString(type, execEnv);
      let match, isUnsigned, lenExp, loExp, hiExp;

      // Reverse conversion for the 'string' type.
      if (type === "string") {
        let indOfNullChar = combBinArr.indexOf(0, accLen);
        if (indOfNullChar === -1) {
          throw new ArgTypeError(
            "Invalid string encoding that does not end in a null character: " +
            `${base64Str}`,
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
              `Invalid UFT-8 string encoding: ${base64Str}`,
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
          `Invalid hexadecimal string encoding: ${base64Str}`,
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
        if (accLen + len > combLen) throw new ArgTypeError(
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

      // Reverse conversion for the 'float(lo?,hi?,len)' type.
      [match, loExp, hiExp, lenExp] = type.match(FLOAT_TYPE_REGEX) ?? [];
      if (match) {
        let len = parseInt(lenExp);
        if (Number.isNaN(len) || len < 1 || len > 6) throw new ArgTypeError(
          "Float byte length needs to be between 1 and 6, but got: " +
          lenExp.substring(1),
          callerNode, execEnv
        );
        let lo = parseFloat(loExp);
        let hi = parseFloat(hiExp);
        if (loExp && Number.isNaN(lo) || hiExp && Number.isNaN(hi)) {
          throw new ArgTypeError(
            "Invalid float limit: " +
            (loExp && Number.isNaN(lo) ? loExp : hiExp),
            callerNode, execEnv
          );
        }
        if (combLen < accLen + len + (loExp && hiExp ? 0 : 1)) {
          throw new ArgTypeError(
            "End of the base 64 string was reached before all array entries " +
            "was converted",
            callerNode, execEnv
          );
        }

        // Reverse the above encodings depending on which limits are defined.
        let val;
        if (loExp && hiExp) {
          let binArr = combBinArr.slice(accLen, accLen + len);
          accLen = accLen + len;
          let n = parseInt(binArr.toHex(), 16);
          val = lo + (hi - lo) * n / maxUInts[len - 1];
        }
        else {
          let binArr = combBinArr.slice(accLen, accLen + len + 1);
          accLen = accLen + len + 1;
          let exp = binArr[0];
          if (hiExp) {
            binArr = new Uint8Array(binArr.map(x => -x - 1));
            exp = binArr[0];
          }
          if (loExp || hiExp) {
            exp = exp - 128;
            let n = parseInt(binArr.toHex().substring(2), 16);
            val =  2**(exp + 1) * n / maxUInts[len - 1];
            val = loExp ? val + lo : hi - val;
          }
          else {
            let isNegative = (exp < 128);
            if (isNegative) {
              binArr = new Uint8Array(binArr.map(x => -x - 1));
              exp = binArr[0];
            }
            exp = exp - 192;
            let n = parseInt(binArr.toHex().substring(2), 16);
            val =  2**(exp + 1) * n / maxUInts[len - 1];
            val = isNegative ? -val : val;
          }
        }
        
        val = parseFloat(val.toPrecision(Math.floor(8 * len / Math.log2(10))));
        valArr.push(val);
        return;
      }

      // If code reaches here, throw an 'unrecognized type' error.
      throw new ArgTypeError(
        `Unrecognized type: ${type}`,
        callerNode, execEnv
      );
    });

    if (acceptIncomplete) {
      let remainder = combBinArr.slice(accLen)
        .toBase64({alphabet: "base64url"});
      return [valArr, remainder];
    }
    else {
      if (accLen !== combLen) throw new ArgTypeError(
        "The base 64 decoding did not exhaust the input string",
        callerNode, execEnv
      );
      return valArr;
    }
  }
);



export const valueToBase64 = new DevFunction(
  "valueToBase64", {typeArr: ["any", "string"]},
  function({callerNode, execEnv}, [val, type]) {
    if (type === "string") {
      return textEncoder.encode(val).toBase64({alphabet: "base64url"});
    }
    else if (type === "hex-string") {
      try {
        return Uint8Array.fromHex(val).toBase64({alphabet: "base64url"});
      }
      catch (err) {
        if (err instanceof TypeError || err instanceof SyntaxError) {
          throw new ArgTypeError(
            "Invalid hexadecimal string: " +
            getString(val, execEnv),
            callerNode, execEnv
          );
        }
      }
    }
    else return arrayToBase64.fun({callerNode, execEnv}, [[val], [type]]);
  }
);

export const valueFromBase64 = new DevFunction(
  "valueFromBase64", {typeArr: ["string", "string"]},
  function({callerNode, execEnv}, [base64Str, type]) {
    if (type === "string") {
      try {
        return textDecoder.decode(
          Uint8Array.fromBase64(base64Str, {alphabet: "base64url"})
        );
      }
      catch (err) {
        if (err instanceof TypeError || err instanceof SyntaxError) {
          throw new ArgTypeError(
            "Invalid base 64 string: " +
            getString(base64Str, execEnv),
            callerNode, execEnv
          );
        }
      }
    }
    else if (type === "hex-string") {
      try {
        return Uint8Array.fromBase64(base64Str, {alphabet: "base64url"})
          .toHex();
      }
      catch (err) {
        if (err instanceof TypeError || err instanceof SyntaxError) {
          throw new ArgTypeError(
            "Invalid base 64 string: " +
            getString(base64Str, execEnv),
            callerNode, execEnv
          );
        }
      }
    }
    else return arrayFromBase64.fun({callerNode, execEnv}, [base64Str, [type]]);
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






// TODO: Just use ~x = -x - 1 when x is a signed int(1) instead of using the
// following functions.

function bitwiseNegateHexString(hexStr) {
  return hexStr.split("").map(char => bitwiseNegateHexadecimal(char)).join("");
}

function bitwiseNegateHexadecimal(char) {
  return (char === "0") ? "f" :
    (char === "1") ? "e" :
    (char === "2") ? "d" :
    (char === "3") ? "c" :
    (char === "4") ? "b" :
    (char === "5") ? "a" :
    (char === "6") ? "9" :
    (char === "7") ? "8" :
    (char === "8") ? "7" :
    (char === "9") ? "6" :
    (char === "a") ? "5" :
    (char === "b") ? "4" :
    (char === "c") ? "3" :
    (char === "d") ? "2" :
    (char === "e") ? "1" :
    (char === "f") ? "0" : "_";
}