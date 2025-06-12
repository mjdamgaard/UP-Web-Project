
import {
  DevFunction, TypeError, forEach, toString, getEntry, ArgTypeError
} from '../interpreting/ScriptInterpreter.js';

const textEncoder = new TextEncoder();

const NULL_CHAR_REGEX = /\0/;
const HEX_STRING_TYPE_REGEX = /^([0-9A-F]{2})*$/;
const BASE64_STRING_TYPE_REGEX = /^([A-Za-z0-9\-_]*={0,3})$/;
const INTEGER_TYPE_REGEX = /^(u)?int(\([1-9][0-9]*\))?$/;
const FLOAT_TYPE_REGEX =
  /^float\(([1-9][0-9]*),([0-9.E+\-]+),([0-9.E+\-]+)\)?$/;

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
      let match, isUnsigned, lenPar, lo, hi;

      // If type = 'string' treat val as a string of variable length.
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

      // If type = '[u]int[(len)]' treat val as an integer of len bytes.
      [match, isUnsigned, lenPar] = type.match(INTEGER_TYPE_REGEX);
      if (match) {
        let val = parseInt(getEntry(valArr, ind));
        if (val === NaN) throw new ArgTypeError(
          `Cannot convert a non-integer to a uint type: ${val}`,
          callerNode, execEnv
        );
        let len = parseInt(lenPar ? lenPar.slice(1, -1) : 4);
        if (len === NaN || len < 1 || len > 6) throw new ArgTypeError(
          "Integer byte length needs to be between 1 and 6, but got: " +
          lenPar.slice(1, -1),
          callerNode, execEnv
        );
        // If the integer is unsigned, add |minInt| to translate the minInt-
        // maxInt range into the 0-maxUInt range.
        if (isUnsigned) {
          val = val - minInts[len - 1];
        } 
        let binArr = new Uint8Array(getBytes(val, len, callerNode, execEnv));
        binArrArr.push(binArr);
        return;
      }
    });
  }
);



export const valueToBase64 = new DevFunction(
  {},
  function(
    {callerNode, execEnv},
    [val, type]
  ) {
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
