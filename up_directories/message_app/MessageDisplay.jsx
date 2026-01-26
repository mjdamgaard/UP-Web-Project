
import {post} from 'query';
import {getUserEntPath} from "/1/1/entities.js";
import * as EntityReference from "/1/2/misc/EntityReference.jsx";


export function render({message, authorID, userID, messageID}) {
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
      <div className={"delete-button" + (isAuthor ? " active" : "")}>{
        isAuthor ?
          <button onClick={() => this.do("delete-message")}>
            Delete
          </button> :
          undefined
      }</div>
    </div>
  );
}


export const actions = {
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
};