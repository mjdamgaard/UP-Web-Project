
import {post} from 'query';
import * as Textarea from 'Textarea.jsx';



export function render() {
  let {response} = this.state;

  return (
    <div className="new-post-field">
      <h3>{"Make a new post"}</h3>
      <Textarea key="ta" />
      <button onClick={() => {
        this.do("submitPost");
      }}>{"Post"}</button>
      <div className="response-text">{response}</div>
    </div>
  );
}


export const actions = {
  "submitPost": function() {
    let text = this.call("ta", "getValue");
    if (!text) {
      this.setState(state => ({
        ...state, response: <span className="warning">{
          "Cannot post empty text"
        }</span>
      }));
    }
    else {
      this.setState(state => ({...state, response: "Posting..."}));
      post(
        abs("./server/posts/posts.sm.js") + "/callSMF/createPost",
        text
      ).then(wasUpdated => {
        if (wasUpdated) {
          this.setState(state => ({
            ...state, response: <span className="success">{
              "Success!"
            }</span>
          }));
          this.trigger("new-post-made");
          // TODO: Catch this event in UserPage.jsx refresh the post wall.
        }
        else {
          this.setState(state => ({
            ...state, response: <span className="warning">{
              "Something went wrong. "
            }</span>
          }));
        }
      });
    }
  }
};