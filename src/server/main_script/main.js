
import {query} from 'db';

export function main(
  method, route, postData, receiverCacheTime, cachePeriod
) {
  let wasReady;
  let onWasReady = () => {
    wasReady = true;
  };
  query(
    method, route, postData, receiverCacheTime, cachePeriod, onWasReady,
    result => exit([result, wasReady]),
  );
}