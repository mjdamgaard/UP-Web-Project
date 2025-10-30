
import {fetchPrivate} from 'query';
import {map} from 'array';
import * as Post from "./Post.jsx";


export function getInitialState({userID}) {
  return {curUserID: userID};
}

export function render({userID, ownUserID}) {
  let {curUserID, isFetching, postList} = this.state;
  let content = "";

  // If the userID prop has changed, reset the state.
  if (userID !== curUserID) {
    this.setState(getInitialState(this.props));
  }

  // And if fetch the request has not yet been sent, do so.
  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    fetchPrivate(
      abs("../server/posts/posts.sm.js") + "/callSMF/fetchPostList/" + userID
    ).then(postList => {
      this.setState(state => ({...state, postList: postList ?? false}));
    });
  }

  // Then if waiting for the postList, render a "fetching" span, which can be
  // restyled at will.
  if (postList === undefined) {
    content = <span className="fetching">{"..."}</span>;
  }

  // Else if postList did not return correctly, render an error message.
  else if (!postList) {
    content = <span className="error">{
      "Something went wrong when fetching the post list"
    }</span>;
  }

  // Else if the postList has returned (where each entry is of the form
  // [textID, timestamp]), render the list of posts.
  else {
    content = map(postList, ([textID, timestamp]) => (
      <Post key={"p-" + textID} textID={textID}
        userID={userID} ownUserID={ownUserID} timestamp={timestamp}
      />
    ));
  }

  return (
    <div className="user-post-wall">
      {content}
    </div>
  );
}