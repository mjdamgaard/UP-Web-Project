
import * as ILink from 'ILink.jsx';


export function getInitialState({userID}) {
  return {curUserID: userID};
}

export function render({userID, isLink = true}) {
  let {curUserID, isFetching, username} = this.state;
  pushState ??= isLink ? (this.subscribeToContext("history") ?? {}).pushState :
    undefined;
  let content = "", href = "./";

  // If the userID prop has changed, reset the state.
  if (userID !== curUserID) {
    this.setState(getInitialState(this.props));
  }

  // If userID is undefined, render "no user".
  if (!userID) {
    return <span className={"user-reference no-id"}>{"no user"}</span>;
  }
  
  // Else ff fetch request has not been sent off yet, do so.
  if (!isFetching) {
    fetch(
      abs("./server/users/user_names.sm.js") + "/callSMF/fetchUsername/"
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

  // And else return a span element either with or without an ILink, depending
  // on the 'isLink' prop.
  return isLink ?
    <span className={"user-reference"}>
      <ILink key="0" href={href} pushState={pushState} >{
        content
      }</ILink>
    </span> :
    <span className={"user-reference"}>{content}</span>;
}
