
import * as InputCheckbox from 'InputCheckbox';
import * as Label from 'Label';


// By using "appDirID" as a key prop, we ensure that the session storage items
// don't get mixed, meaning that the user dismissed the warning only for the
// current app.
export const keyProps = ["appDirID"];

export function initialize() {
  return {
    dismissed: this.getSessionStorageItem("dismissed"),
    cbIDKey: Symbol("checkbox"),
  };
}

export function render({appDirID, isHarmful}) {
  let {dismissed, cbIDKey} = this.state;
  this.trigger("showHeader");
  return <div className={"warning" + (
    (isHarmful || !dismissed) ? "" :
      (dismissed === "fully") ? " closed hidden" : " closed"
  )}>
    <div className="warning-bar" 
      onClick={() => this.do("openWarning")}
    >{"⚠".repeat(500)}</div>
    {(isHarmful ?
      <div className="warning harmful-app">
        <p>
          This app has been declared as harmful by the user community.
        </p>
        <div className="buttons">
          <button onClick={() => this.back()}>Take me back!</button>
        </div>
      </div> :
      <div className="warning-main">
        <p>
          <b>PROCEED WITH CAUTION!</b> This app has not yet been reviewed and
          declared as safe yet by the community, and therefore cannot be
          guaranteed to be free from phishing attempts and free from
          inappropriate content.
        </p>
        <p>
          Proceed only if you 18 years or older, and know not to fall for any
          phishing attempts, or if you trust the creator of this app.
        </p>
        <div className="buttons">
          <button onClick={() => this.do("closeWarning")}>
            I understand and wish to proceed
          </button>
          <button onClick={() => this.back()}>Take me back!</button>
        </div>
        <div className="checkbox">
          <InputCheckbox key="cb" idKey={cbIDKey} />
          <Label key="l-rem" forKey={cbIDKey}>
            I trust the author of this app
          </Label>
        </div>
      </div>
    )}
  </div>
}


export const actions = {
  "closeWarning": function() {
    let isChecked = this.call("cb", "getIsChecked");
    let dismissed = isChecked ? "fully" : "true";
    this.setState({dismissed: dismissed});
    this.setSessionStorageItem("dismissed", dismissed);
  },
  "openWarning": function() {
    this.setState({dismissed: undefined});
    this.removeSessionStorageItem("dismissed");
  }
};