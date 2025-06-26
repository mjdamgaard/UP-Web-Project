




function getDataChunksPromise(req) {
  return new Promise((resolve, reject) => {
      let chunks = [];
      let size = 0;
      req.on('data', chunk => {
        chunks.push(chunk);
        size += chunk.length ?? chunk.size;
        if (size > 4294967295) reject(
          new ClientError("Post data maximum size exceeded")
        );
      });
      req.on('end', () => {
          resolve(chunks);
      });
  });
}


export async function getData(req) {
  let chunks = await getDataChunksPromise(req);

  // TODO: Implement returning a string only if chunks are UFT-8 string parts,
  // and not binary data chunks, in which case return something like a Buffer.
  return chunks.reduce(
    (acc, val) => acc + val.toString(),
    ""
  ); 
}
