
import {query} from 'server';

export function main(
  method, route, postData, maxAge, noCache, lastUpToDate, onCached, resolve
) {
  query(
    method, route, postData, maxAge, noCache, lastUpToDate, onCached,
    output => resolve(output),
  );
}