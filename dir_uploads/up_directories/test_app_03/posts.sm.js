
import {post} from 'query';
import homePath from "./.id.js";


export function postText(text) {
  return Promise(resolve => {
    post(homePath + "/posts.att/_insert", text).then(
      ([[wasCreated]]) => resolve(wasCreated)
    );
  });
}
