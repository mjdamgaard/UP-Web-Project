
import {post, getCurHomeDirPath} from 'query';

export function render() {
  return (
    <div>
      <button onClick={() => {
        let homeDirPath = getCurHomeDirPath();
        post(homeDirPath + "/posts.sm.js/postText", "<Something>");
      }}>
        {"Post something"}
      </button>
    </div>
  );
}
