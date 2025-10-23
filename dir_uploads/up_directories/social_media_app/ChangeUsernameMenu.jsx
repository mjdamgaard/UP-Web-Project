
import * as InputText from 'InputText.jsx';


export function render({userID}) {
  let {expandChangeUsernameMenu, response} = this.state;

  return (
    <div className="change-username-menu">
      <button className={expandChangeUsernameMenu ? " hidden" : ""}
        onClick={() => {

        }
      }>{"Change username?"}</button>
      <div className={expandChangeUsernameMenu ? "" : " hidden"}>
        <h4>{"Insert new username"}</h4>
        <InputText key="it" size={50} />
        <button onClick={() => {
          this.do("submitUsername");
        }}>{"Submit new username"}</button>
        <div className="response-text">{response}</div>
      </div>
    </div>
  );
}


export const actions = {
  "submitUsername": function() {
    let username = this.call("it", "getValue");
    if (!username) {
      this.setState(state => ({
        ...state, response: <span className="warning">{
          "Invalid username"
        }</span>
      }));
    }
    else {
      this.setState(state => ({...state, response: "Submitting..."}));
      post(
        abs("./server/users/usernames.sm.js") + "/callSMF/requestNewUsername",
        username
      ).then(wasUpdated => {
        if (wasUpdated) {
          this.setState(state => ({
            ...state, response: <span className="success">{
              "Username changed!"
            }</span>
          }));
        }
        else {
          this.setState(state => ({
            ...state, response: <span className="warning">{
              "Username is already taken"
            }</span>
          }));
        }
      });
    }
  }
};