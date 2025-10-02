
import {queryRoute} from 'query';

export function main(
  route, isPost, postData, options, resolve
) {
  queryRoute(route, isPost, postData, options).then(
    output => resolve(output)
  );
}