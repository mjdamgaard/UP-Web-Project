
import {post} from 'query';
import {getUserEntPath} from "/1/1/entities.js";
import * as EntityReference from "/1/2/misc/EntityReference.jsx";
import * as EditField from "./EditField.jsx";


export function render({message, authorID, userID, messageID}) {
  let {delPromptIsOpen, editorIsOpen} = this.state;
  let isAuthor = userID === authorID;
  let authorEntityPath = getUserEntPath("1", authorID);
  return (
    <div className="message-display">
      <div className="author">
        <EntityReference key="auth-ref" entKey={authorEntityPath} />
      </div>
      <div className="text">
        {message}
      </div>
      <div className={"edit-menu" + (isAuthor ? "" : " hidden")}>
        <button onClick={() => this.do("toggle-message-editor")}>
          Edit
        </button>
        <button onClick={() => this.do("toggle-message-deletion-prompt")}>
          Delete
        </button>
      </div>
      <div className={"editor" + (editorIsOpen ? "" : " hidden")}>
        <EditField key="ef"
          userID={userID} message={message} messageID={messageID}
        />
      </div>
      <div className={"deletion-prompt" + (delPromptIsOpen ? "" : " hidden")}>
        <div>Are you sure you wish to delete this message?</div>
        <button onClick={() => this.do("delete-message")}>
          Yes
        </button>
      </div>
    </div>
  );
}


export const events = [
  ["successful-edit", "handle-successful-edit"],
];


export const actions = {
  "toggle-message-editor": function() {
    this.setState(state => ({
      ...state, delPromptIsOpen: false, editorIsOpen: !state.editorIsOpen,
    }));
  },
  "toggle-message-deletion-prompt": function() {
    this.setState(state => ({
      ...state, delPromptIsOpen: !state.delPromptIsOpen, editorIsOpen: false,
    }));
  },
  "delete-message": function() {
    let {messageID} = this.props;
    post(
      abs("./server/messages.sm.js./callSMF/deleteMessage/" + messageID)
    ).then(wasDeleted => {
      if (wasDeleted) {
        this.trigger("refresh");
      }
    });
  },
  "handle-successful-edit": function() {
    this.setState(state => ({
      ...state, delPromptIsOpen: false, editorIsOpen: false,
    }));
    this.trigger("refresh");
  },
};