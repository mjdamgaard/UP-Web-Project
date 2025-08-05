
import {post} from 'query';
import homePath from "./.id.js";
import * as JSON from 'json';
import * as Textarea from 'Textarea1.jsx';
import * as CharCount from './CharCount.jsx';

export function render({userID}) {
  let {response = ""} = this.state;
  return (
    <div>
      <CharCount key={1} />
      <div>
        <Textarea key={0} onChange={dispatchCharCount}/>
      </div>
      <button onClick={() => {
        if (!userID) {
          this.setState({
            ...this.state, response: "You must be logged in before posting."
          });
        }
        let textVal = this.call(0, "getValue");
        // TODO: Make a 'strings' dev library with a stringify() function in
        // particular, and use it here:
        if (textVal) {
          post(
            homePath + "/posts.sm.js/callSMF/postText",
            JSON.stringify([textVal]),
          ).then(wasCreated => {this.call(0, "clear");
            if (wasCreated) {
              this.call(0, "clear");
              this.setState({
                ...this.state, response: "Success."
              });
              this.dispatch("refresh");
            }
            else {
              this.setState({
                ...this.state, response: "Something went wrong."
              });
            }
          });
        }
      }}>
        {"Post"}
      </button>
      <div>{response}</div>
    </div>
  );
}

export const events = [
  "setCharCount",
];

export const actions = {
  "setCharCount": function(count) {
    this.call(1, "setCharCount", count);
  }
};

function dispatchCharCount() {
  let text = this.do("getValue");
  let count = text.length;
  this.trigger("setCharCount", count);
}