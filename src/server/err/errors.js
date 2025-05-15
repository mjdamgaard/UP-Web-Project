import {
  getExtendedErrorMsg, RuntimeError, SyntaxError,
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
  else if (err instanceof RuntimeError || err instanceof SyntaxError) {
    res.end(getExtendedErrorMsg(err));
  }
  else throw err;
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