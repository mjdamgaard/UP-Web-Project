
import {fetch} from 'query';
import {map} from 'array';
import * as MessageDisplay from "./MessageDisplay.jsx";


export function initialize() {
  this.do("refresh");
}

export function render({userID}) {
  let {messageList} = this.state;

  if (!messageList) {
    // this.do("refresh");
    return <div className="message-list"></div>;
  }

  let children = map(messageList, ([id, message, authorID]) => (
    <MessageDisplay key={"m-" + id}
      message={message} authorID={authorID} userID={userID} messageID={id}
    />
  ));
  return (
    <div className="message-list">
      {children}
    </div>
  );
}


export const methods = [
  "refresh",
];

export const actions = {
  "refresh": function() {
    let {userID} = this.props;
    if (!userID) return;
    fetch(
      abs("./server/messages.sm.js./callSMF/fetchMessages/1000")
    ).then(messageList => {
      this.setState(state => ({...state, messageList: messageList}));
    });
  },
};