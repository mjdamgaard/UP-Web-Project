
import {fetchPrivate} from 'query';
import {map} from 'array';
import * as FriendDisplay from "./FriendDisplay.jsx";
import * as FriendRequestDisplay from "./FriendRequestDisplay.jsx";
import * as AddNewFriendMenu from "./AddNewFriendMenu.jsx";


export function getInitialState({userID}) {
  return {curUserID: userID};
}


export function render({userID}) {
  let {curUserID, isFetching, friendList, friendRequestList} = this.state;
  let content = "";

  // If the userID prop has changed, reset the state.
  if (userID !== curUserID) {
    this.setState(getInitialState(this.props));
  }

  // And if fetch the request has not yet been sent, do so.
  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    fetchPrivate(
      abs("../server/friends/friends.sm.js") +
      "/callSMF/fetchFriendList/" + userID
    ).then(friendList => {
      this.setState(state => ({...state, friendList: friendList ?? false}));
    });
    fetchPrivate(
      abs("../server/friends/friends.sm.js") +
      "/callSMF/fetchFriendRequestList"
    ).then(friendRequestList => {
      this.setState(state => ({
        ...state, friendRequestList: friendRequestList ?? false
      }));
    });
  }

  // Then if waiting for the lists, render a "fetching" span, which can be
  // restyled at will.
  if (friendList === undefined || friendRequestList === undefined) {
    content = <span className="fetching">{"..."}</span>;
  }

  // Else if one of the lists did not return correctly, render an error message.
  else if (!friendList || !friendRequestList) {
    content = <span className="error">{
      "Something went wrong. Make sure that you are logged in."
    }</span>;
  }

  // Else if both lists have returned, render a div with the non-declined
  // friend requests, followed by a div with the friends.
  else {
    content = [
      <div className="friend-requests">{
        map(friendRequestList, ([otherUserID, timestamp, isDeclined]) => (
          isDeclined ? undefined :
            <FriendRequestDisplay key={"f-req-" + otherUserID}
              otherUserID={otherUserID} ownUserID={userID}
              timestamp={timestamp}
            />
        ))
      }</div>,
      <hr/>,
      <div className="friend-list">{
        map(friendList, ([friendID, timestamp]) => (
          <FriendDisplay key={"f-" + friendID}
            friendID={friendID} ownUserID={userID} timestamp={timestamp}
          />
        ))
      }</div>,
    ];
  }

  return (
    <div className="friends-page">
      <h2>{"Friends"}</h2>
      <AddNewFriendMenu key="new-f-menu" />
      <hr/>
      {content}
    </div>
  );
}