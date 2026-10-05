
import {post} from 'query';


export function postText(text) {
  return post("~/posts.att/insert", text);
}
