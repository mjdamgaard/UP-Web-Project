
import {post} from 'query';


export function postText(text) {
  return post("~/posts.att/_insert", text);
}
