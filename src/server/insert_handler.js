


export async function insert_handler(req, res) {

  // TODO: Authenticate user here via a get or post request to
  // localhost:80/authenticate.php.

  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('Hello World!');
} 