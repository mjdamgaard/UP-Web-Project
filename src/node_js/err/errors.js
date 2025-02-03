

export class Error {
  constructor(msg) {
    this.error = msg;
  }
}

export function endWithError(res, error) {
  res.writeHead(400, {'Content-Type': 'text/json'});
  if (typeof error === "object") {
    res.end(JSON.stringify(error));
  } else {
    res.end(JSON.stringify({error: error}));
  }
}


export function endWithInternalError(res, error) {
  res.writeHead(500, {'Content-Type': 'text/html'});
  res.end("");
  throw error;
}


export function throwTypeError(res, paramName, paramVal, expectedType) {
  throw new Error (
    "Parameter " + paramName + "=" + paramVal + " has a wrong type; " +
    "expected type is " + expectedType
  );
}