
import {fetch} from 'query';

import * as ILink from 'ILink.jsx';


export function initialize({userID}) {
  return {curUserID: userID};
}

export function render({userID, isLink = true, pushState = undefined}) {
  let {curUserID, isFetching, username} = this.state;
  pushState ??= isLink ? (this.subscribeToContext("history") ?? {}).pushState :
    undefined;
  let content = "", href = "~/u/" + userID;

  // If the userID prop has changed, reset the state.
  if (userID !== curUserID) {
    this.setState(initialize(this.props));
  }

  // If userID is undefined, render "no user".
  if (!userID) {
    return <span className={"user-reference no-id"}>{"no user"}</span>;
  }
  
  // Else if fetch the request has not yet been sent, do so.
  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    fetch(
      abs("./server/users/usernames.sm.js") + "./callSMF/fetchUsername/" +
      userID
    ).then(username => {
      this.setState(state => ({...state, username: username ?? false}));
    });
  }

  // And if waiting for the username, render a "fetching" span, which can be
  // restyled at will.
  if (username === undefined) {
    content = <span className="fetching">{"..."}</span>;
  }

  // Else if the username is missing, render "User <userID>" instead.
  else if (!username) {
    content = <span className="missing-name">{"User " + userID}</span>;
  }

  // And else render the username.
  else {
    content = <span>{username}</span>;
  }

  // FInally return a span element either with or without an ILink, depending
  // on the 'isLink' prop.
  return isLink ?
    <span className={"user-reference"}>
      <ILink key="0" href={href} pushState={pushState} >{
        content
      }</ILink>
    </span> :
    <span className={"user-reference"}>{content}</span>;
}
