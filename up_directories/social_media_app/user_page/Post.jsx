
import {fetchPrivate} from 'query';
import * as UserReference from "../UserReference.jsx";


export function render({textID, userID, ownUserID, timestamp}) {
  let {isFetching, text} = this.state;
  let content = "";

  // And if fetch the request has not yet been sent, do so.
  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    fetchPrivate(
      abs("../server/posts/posts.sm.js") + "./callSMF/fetchPostText/" +
      userID + "/" + textID
    ).then(text => {
      this.setState(state => ({...state, text: text ?? false}));
    });
  }

  // Then if waiting for the text, render a "fetching" span, which can be
  // restyled at will.
  if (text === undefined) {
    content = <span className="fetching">{"..."}</span>;
  }

  // Else if text did not return correctly render an error message.
  else if (!text) {
    content = <span className="error">{
      "Something went wrong when fetching the text"
    }</span>;
  }

  // Else if the text has returned, render the text. 
  else {
    content = <div className="post-text">{text}</div>;
  }

  return (
    <div className="post">
      <h4><UserReference key="u" userID={userID} /></h4>
      {content}
    </div>
  );
}