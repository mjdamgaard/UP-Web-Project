
import {login} from 'account';
import * as Form from 'Form';
import * as InputText from 'InputText';
import * as Label from 'Label';

const userNameIDKey = Symbol("input-username");
const passwordIDKey = Symbol("input-password");


export function render({}) {
  let {response} = this.state;
  return <div className="login-page">
    <div className="go-back-button" onClick={() => this.do("goBack")}></div>
    <div className="page-content">
      <h2>Log in</h2>
      <Form key="f">
        <div className="form-group">
          <Label key="l-usr" forKey={userNameIDKey}>Username</Label>
          <InputText key="i-usr" className="form-control username"
            idKey={userNameIDKey} lockFocus autocomplete="on"
          />
        </div>
        <div className="form-group">
          <Label key="l-pw" forKey={passwordIDKey}>Password</Label>
          <InputText key="i-pw" className="form-control password"
            idKey={passwordIDKey} type="password" lockFocus autocomplete="on"
          />
        </div>
        <button className="btn btn-primary" onClick={() => this.do("submit")}>
          Log in
        </button>
      </Form>
      <div className="response-display text-warning">{response}</div>
    </div>
  </div>;
}


export const actions = {
  "goBack": function() {
    this.trigger("closeOverlayPage");
  },
  "submit": function() {
    let username = this.call("f", "call", ["i-usr", "getValue"]);
    let password = this.call("f", "call", ["i-pw", "getValue"]);
    login(username, password).then(response => {
      if (response) {
        this.setState({response: response});
      }
    }).catch(err => {
      console.error(err);
      this.setState({response: "An error occurred"});
    });
  },
};


