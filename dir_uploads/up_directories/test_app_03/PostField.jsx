
import {post} from 'query';
import * as Textarea from 'Textarea.jsx';

export function render() {
  return (
    <div>
      <div>
        <Textarea key={0} onChange={increaseCount}/>
      </div>
      <button onClick={() => {
        post("/1/3/posts.sm.js/callSMF/postText", '["<Something>"]');
      }}>
        {"Post something"}
      </button>
      <div>{"Number of times changed: "}{this.state.count ?? 0}</div>
    </div>
  );
}

function increaseCount() {
  console.log(this.state);
  console.log(this.state.count);
  // this.setState({...this.state, count: (this.state.count ?? 0) + 1});
}