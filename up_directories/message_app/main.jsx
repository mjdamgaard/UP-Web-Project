
// A test app that shows that the backend works, at least enough to have a
// server module that governs an ATT table.

import * as PostField from "./PostField.jsx";
import * as MessageList from "./MessageList.jsx";

export function render({userID}) {
  return (
    <div>
      <h2>{"Post a message!"}</h2>
      <PostField key="pf" userID={userID} />
      <MessageList key="ml" />
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