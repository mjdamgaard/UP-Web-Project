
import {queryRoute} from 'query';

export function main(
  isPublic, route, isPost, postData, options, resolve
) {
  queryRoute(isPublic, route, isPost, postData, options).then(
    output => resolve(output)
  );
}