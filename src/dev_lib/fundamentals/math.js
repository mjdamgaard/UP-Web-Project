
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

export const random = new DevFunction(
  "random", {}, () => {
    return Math.random();
  }
);


// TODO: Continue implementing all other standard Math functions/methods.