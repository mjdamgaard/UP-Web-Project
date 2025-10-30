
import {post} from 'query';
import homePath from "./.id.js";


export function postText(text) {
  return post(homePath + "/posts.att/_insert", text);
}
