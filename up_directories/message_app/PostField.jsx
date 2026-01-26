
import {post} from 'query';
import * as TextArea from 'TextArea.jsx';

export function render({userID}) {
  let {response = ""} = this.state;
  return (
    <div className="post-field">
      <div>
        <TextArea key="ta" />
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
            abs("./server/messages.sm.js./callSMF/postMessage"), textVal
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
