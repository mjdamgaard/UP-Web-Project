
import {post} from 'query';
import homePath from "./.id.js";
import * as Textarea from 'Textarea.jsx';

export function render() {
  return (
    <div>
      <div>
        <Textarea key={0} onChange={increaseCount}/>
      </div>
      <button onClick={() => {
        let textVal = this.call(0, "getValue#?=$@#!");
        // TODO: Make a 'strings' dev library with a stringify() function in
        // particular, and use it here:
        if (textVal) {
          post(homePath + "/posts.sm.js/callSMF/postText", '"' + textVal + '"');
        }
      }}>
        {"Post"}
      </button>
      <div>{"Number of times changed: "}{this.state.count ?? 0}</div>
    </div>
  );
}

export const actions = {
  "increaseCount": function() {
    // this.setState({...this.state, count: (this.state.count ?? 0) + 1});
  }
};

function increaseCount() {
  this.dispatch("increaseCount");
}