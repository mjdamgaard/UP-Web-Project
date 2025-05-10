import {
  LexError, LoadError, OutOfGasError, RuntimeError, SyntaxError,
} from "../../interpreting/ScriptInterpreter.js";


export class ClientError {
  constructor(msg) {
    this.error = msg;
  }
}

export function endWithError(res, err) {
  res.writeHead(400, {'Content-Type': 'text/json'});
  if (err instanceof ClientError) {
    res.end(`ClientError: "${err.error}"`);
  }
  else if (err instanceof LoadError) {
    res.end(`LoadError: "${err.val}"`);
  }
  else if (err instanceof OutOfGasError) {
    res.end(`OutOfGasError: "${err.val}"`);
  }
  else if (err instanceof RuntimeError) {
    res.end(`RuntimeError: "${err.val}"`);
  }
  else if (err instanceof LexError) {
    res.end(`LexError: "${err.val}"`);
  }
  else if (err instanceof SyntaxError) {
    res.end(`SyntaxError: "${err.val}"`);
  }
  else if (typeof err === "string") {
    res.end(JSON.stringify(err));
  }
  else {
    res.end("endWithError(): Unrecognized type of error");
  }
}


export function endWithInternalError(res, error) {
  res.writeHead(500, {'Content-Type': 'text/html'});
  res.end("");
  console.error(error);
}


export function throwTypeError(paramName, paramVal, expectedType) {
  throw new ClientError (
    "Parameter " + paramName + " = " + paramVal + " has a wrong type; " +
    "expected type is " + expectedType
  );
}