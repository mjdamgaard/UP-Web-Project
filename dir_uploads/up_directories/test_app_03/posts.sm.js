
import {post, getCurHomeDirPath} from 'query';


export function _init() {
  let homeDirPath = getCurHomeDirPath();
  post(homeDirPath + "/posts.att/_put");
}

export function _rm() {
  let homeDirPath = getCurHomeDirPath();
  post(homeDirPath + "/posts.att/_delete");
}



export function postText(text) {
  let homeDirPath = getCurHomeDirPath();
  post(homeDirPath + "/posts.att/_insert", text);
}
