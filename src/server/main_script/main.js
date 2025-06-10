
import {query} from 'query';

export function main(
  isPublic, route, isPost, postData, options, resolve
) {
  query(
    isPublic, route, isPost, postData, options, output => resolve(output)
  );
}