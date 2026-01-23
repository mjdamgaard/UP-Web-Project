
import {post} from 'query';
import homePath from "./.id.js";
import * as TextArea from 'TextArea.jsx';

export function render({userID}) {
  let {response = ""} = this.state;
  return (
    <div>
      <div>
        <TextArea key="ta" onInput={dispatchCharCount}/>
      </div>
      <button onClick={() => {
        if (!userID) {
          this.setState(state => ({
            ...state, response: "You must be logged in before posting."
          }));
          return;
        }
        let textVal = this.call("ta", "getValue");
        if (textVal) {
          post(
            homePath + "/posts.sm.js./callSMF/postText", textVal
          ).then(wasCreated => {
            if (wasCreated) {
              this.call("ta", "clear");
              this.setState(state => ({
                ...state, response: "Success."
              }));
              this.trigger("refresh");
            }
            else {
              this.setState(state => ({
                ...state, response: "Something went wrong."
              }));
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
