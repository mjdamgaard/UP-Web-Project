

export function endWithError(res, msg) {
  res.writeHead(400, {'Content-Type': 'text/json'});
  res.end(JSON.stringify({error: msg}));
}



export function endWithTypeErrorJSON(res, paramName, paramVal, expectedType) {
  res.writeHead(400, {'Content-Type': 'text/json'});
  res.end(JSON.stringify({
    error: (
      "Parameter " + paramName + "=" + paramVal + " has a wrong type; " +
      "expected type is " + expectedType
    )
  }));
}