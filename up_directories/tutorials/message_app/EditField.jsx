
import {post} from 'query';
import * as TextArea from 'TextArea.jsx';



export function render({userID, message, messageID}) {
  let {response = ""} = this.state;
  return (
    <div className="edit-field">
      <div>
        <TextArea key="ta">{message}</TextArea>
      </div>
      <button onClick={() => this.do("editMessage")}>
        Post changes
      </button>
      <button onClick={() => this.trigger("cancel-edit")}>
        Cancel
      </button>
      <div>{response}</div>
    </div>
  );
}




export const actions = {
  "editMessage": function() {
    let {userID, messageID} = this.props;

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
    
    // Post the edited message by calling the editMessage() SMF, and pass the
    // messageID and newText arguments via a post data array. (When the post
    // data, which is the second argument of post(), is an array, it is always
    // treated as an input array for "callSMF" queries.)
    post(
      abs("./server/messages.sm.js./callSMF/editMessage"),
      [messageID, textVal]
    ).then(wasEdited => {
      if (wasEdited) {
        this.setState(state => ({
          ...state, response: "Success."
        }));
        this.trigger("successful-edit");
      }
      else {
        this.setState(state => ({
          ...state, response: "Something went wrong."
        }));
      }
    });
  },
};