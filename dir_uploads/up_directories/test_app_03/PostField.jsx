
import {post} from 'query';
import * as Textarea from 'Textarea.jsx';

export function render() {
  return (
    <div>
      <Textarea key={0} />
      <button onClick={() => {
        post("/1/3/posts.sm.js/callSMF/postText", '["<Something>"]');
      }}>
        {"Post something"}
      </button>
    </div>
  );
}
