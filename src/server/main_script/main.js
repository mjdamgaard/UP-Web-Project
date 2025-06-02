
import {query} from 'server';

export function main(
  route, isPost, postData, options, resolve
) {
  query(
    route, isPost, postData, options, output => resolve(output)
  );
}