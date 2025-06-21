
import {post, getCurHomeDirPath} from 'query';

export function init() {
  let homeDirPath = getCurHomeDirPath();
  post(homeDirPath + "/posts.att/~put");
}
