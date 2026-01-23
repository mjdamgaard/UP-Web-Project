
import {post} from 'query';
import homePath from "../.id.js";


export async function postMessage(text) {
  return post(homePath + "/posts.att./_insert", text);
}
