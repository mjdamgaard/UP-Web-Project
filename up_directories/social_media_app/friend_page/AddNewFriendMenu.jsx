
import {fetch, post} from 'query';
import {substring} from 'string';
import {hasType} from 'type';

import * as InputText from 'InputText.jsx';



export function render() {
  let {response} = this.state;

  return (
    <div className="friend-request-display">
      <h3>{"Add new friend"}</h3>
      <div>{
        "Type in the current username of the friend you wish to add, or type " +
        "in their user ID preceded by a '#' (as in '#123ab')"
      }</div>
      <InputText key="it" size={50} />
      <button onClick={() => {
        this.do("submitFriendRequest");
      }}>{"Send request"}</button>
      <div className="response-text">{response}</div>
    </div>
  );
}


export const actions = {
  "submitFriendRequest": function() {
    let usernameOrID = this.call("it", "getValue");
    if (!usernameOrID) {
      this.setState(state => ({
        ...state, response: <span className="warning">{
          "Type in a username or ID first"
        }</span>
      }));
      return;
    }

    // If the input value is a user ID, validate it and then call the helper
    // function, submitFriendRequestHelper(), directly.
    if (usernameOrID[0] === "#") {
      let otherUserID = substring(usernameOrID, 1);
      if (!otherUserID || !hasType(otherUserID, "hex-string")) {
        this.setState(state => ({
          ...state, response: <span className="warning">{
            "User ID has to be a hexadecimal string"
          }</span>
        }));
      }
      else {
        this.setState(state => ({...state, response: "Submitting..."}));
        this.do("submitFriendRequestHelper", otherUserID);
      }
    }

    // Else if it is a username, first fetch the user ID, and then call
    // submitFriendRequestHelper().
    else {
      let username = usernameOrID;
      let usernameHex = valueToHex(username, "string");
      this.setState(state => ({...state, response: "Submitting..."}));
      fetch(
        abs("./server/users/usernames.sm.js") + "./callSMF/fetchUserID/" +
        usernameHex
      ).then(otherUserID => {
        if (otherUserID) {
          this.do("submitFriendRequestHelper", otherUserID);
        }
        else {
          this.setState(state => ({
            ...state, response: <span className="warning">{
              'No user found with username "' + username + '"'
            }</span>
          }));
        }
      });
    }
  },

  "submitFriendRequestHelper": function(otherUserID) {
    post(
      abs("../server/friends/friends.sm.js") + "./callSMF/requestFriend",
      otherUserID
    ).then(wasUpdated => {
      if (wasUpdated) {
        this.setState(state => ({
          ...state, response: <span className="success">{
            "Friend request sent"
          }</span>
        }));
      }
      else {
        this.setState(state => ({
          ...state, response: <span className="warning">{
            "Something went wrong"
          }</span>
        }));
      }
    });
  }
};