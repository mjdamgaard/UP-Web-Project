
import * as PostField from "./PostField.jsx";
import * as MessageList from "./MessageList.jsx";


export function render({userID}) {
  return userID ? (
    <div>
      <h2>Post a message!</h2>
      <PostField key="pf" userID={userID} />
      <h3>Messages</h3>
      <MessageList key="ml" userID={userID} />
    </div>
  ) : (
    <div>
      <h2>Post a message!</h2>
      <p>
        You must be logged in in order to use this app.
      </p>
    </div>
  );
}

export const events = [
  "refresh",
];

export const actions = {
  "refresh": function() {
    this.call("ml", "refresh");
  }
};


export const styleSheets = [
  abs("./style.css"),
];
