

export class ClientError {
  constructor(msg) {
    this.error = msg;
  }
}

export function endWithError(res, error) {
  res.writeHead(400, {'Content-Type': 'text/json'});
  if (error instanceof ClientError) {
    res.end(`ClientError: "${error.msg}"`);
  }
  else if (typeof error === "object") {
    res.end(JSON.stringify(error));
  } else {
    res.end(JSON.stringify({error: error}));
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