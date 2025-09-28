
import {DevFunction} from "../../interpreting/ScriptInterpreter.js";



const _parseFloat = new DevFunction(
  "parseFloat", {}, ({}, [val]) => {
    return parseFloat(val);
  }
);
export {_parseFloat as parseFloat};

const _parseInt = new DevFunction(
  "parseInt", {}, ({}, [val]) => {
    return parseInt(val);
  }
);
export {_parseInt as parseInt};

export const isNaN = new DevFunction(
  "isNaN", {}, ({}, [val]) => {
    return Number.isNaN(val);
  }
);

export const toPrecision = new DevFunction(
  "toPrecision", {typeArr: ["number", "integer positive?"]},
  ({}, [val, precision]) => {
    return val.toPrecision(precision);
  }
);


// TODO: Continue implementing.