
import {post} from 'query';
import homePath from "./.id.js";
import * as Textarea from 'Textarea1.jsx';
import * as CharCount from './CharCount.jsx';

export function render() {
  return (
    <div>
      <CharCount key={1} />
      <div>
        <Textarea key={0} onChange={dispatchCharCount}/>
      </div>
      <button onClick={() => {
        let textVal = this.call(0, "getValue");
        // TODO: Make a 'strings' dev library with a stringify() function in
        // particular, and use it here:
        if (textVal) {
          post(
            homePath + "/posts.sm.js/callSMF/postText", '["' + textVal + '"]'
          ).then(([wasCreated]) => {
            if (wasCreated) {
              this.call(0, "clear");
            }
            else throw "Post was not received properly";
          });
        }
      }}>
        {"Post"}
      </button>
    </div>
  );
}

export const actions = {
  "setCharCount": function(count) {
    this.call(1, "setCharCount", count);
  }
};

function dispatchCharCount() {
  let text = this.call("", "getValue");
  let count = text.length;
  this.dispatch("setCharCount", count);
}