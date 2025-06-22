
import {post} from 'query';

export function render() {
  return (
    <div>
      <button onClick={() => {
        post("/1/3/posts.sm.js/postText", "<Something>");
      }}>
        {"Post something"}
      </button>
    </div>
  );
}
