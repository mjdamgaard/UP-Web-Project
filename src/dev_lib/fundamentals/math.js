
import {DevFunction} from "../../interpreting/ScriptInterpreter.js";

export const round = new DevFunction(
  "round", {typeArr: ["number"]}, ({}, [x]) => {
    return Math.round(x);
  }
);
export const ceil = new DevFunction(
  "ceil", {typeArr: ["number"]}, ({}, [x]) => {
    return Math.ceil(x);
  }
);
export const floor = new DevFunction(
  "floor", {typeArr: ["number"]}, ({}, [x]) => {
    return Math.floor(x);
  }
);
export const abs = new DevFunction(
  "abs", {typeArr: ["number"]}, ({}, [x]) => {
    return Math.abs(x);
  }
);

export const random = new DevFunction(
  "random", {}, () => {
    return Math.random();
  }
);


export const min = new DevFunction(
  "min", {typeArr: ["number", "number"]}, ({}, [x, y]) => {
    return Math.min(x, y);
  }
);

export const max = new DevFunction(
  "max", {typeArr: ["number", "number"]}, ({}, [x, y]) => {
    return Math.max(x, y);
  }
);


export const log = new DevFunction(
  "log", {typeArr: ["number"]}, ({}, [x]) => {
    return Math.log(x);
  }
);
export const log2 = new DevFunction(
  "log2", {typeArr: ["number"]}, ({}, [x]) => {
    return Math.log2(x);
  }
);
export const log10 = new DevFunction(
  "log10", {typeArr: ["number"]}, ({}, [x]) => {
    return Math.log10(x);
  }
);

// TODO: Continue implementing all other standard Math functions/methods.