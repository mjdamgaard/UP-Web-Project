
import {post, getCurHomeDirPath} from 'query';


export function postText(text) {
  let homeDirPath = getCurHomeDirPath();
  post(homeDirPath + "/posts.att/_insert", text);
}
