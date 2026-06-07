
import {post} from 'query';


export function postText(text) {
  return post(abs("~/posts.att./_insert"), text);
}
