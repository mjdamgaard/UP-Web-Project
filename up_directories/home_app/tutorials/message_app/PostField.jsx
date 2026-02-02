
import {post} from 'query';
import * as TextArea from 'TextArea.jsx';



export function render({userID}) {
  let {response = ""} = this.state;
  return (
    <div className="post-field">
      <div>
        <TextArea key="ta" />
      </div>
      <button onClick={() => this.do("postMessage")}>
        Post
      </button>
      <div>{response}</div>
    </div>
  );
}




export const actions = {
  "postMessage": function() {
    let {userID} = this.props;

    // Check that the user is logged in first.
    if (!userID) {
      this.setState(state => ({
        ...state, response: "You must be logged in before posting."
      }));
      return;
    }

    // Get the text from the text area, and check that it is non-empty.
    let textVal = this.call("ta", "getValue");
    if (!textVal) {
      this.setState(state => ({
        ...state, response: "Message was empty."
      }));
    }
    
    // Post the message by calling the postMessage() SMF.
    post(
      abs("./server/messages.sm.js./callSMF/postMessage"),
      textVal
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
  },
};