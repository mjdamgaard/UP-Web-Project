
import * as PostField from "./PostField.jsx";
import * as MessageList from "./MessageList.jsx";
import * as mainStyle from "./style.css";


export function render({userID}) {
  return (
    <div innerStyle={mainStyle}>
      <h2>Post a message!</h2>
      <PostField key="pf" userID={userID} />
      <h3>Messages</h3>
      <MessageList key="ml" userID={userID} />
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
