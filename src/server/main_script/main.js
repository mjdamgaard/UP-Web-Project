
import {query} from 'server';

export function main(
  method, route, postData, receiverCacheTime, cachePeriod
) {
  query(
    method, route, postData, receiverCacheTime, cachePeriod,
    output => exit(output),
  );
}