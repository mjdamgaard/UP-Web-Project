


export function initialize() {
  return {dismissed: this.getSessionStorageItem("dismissed")};
}

export function render({isHarmful}) {
  let {dismissed} = this.state; 
  return <div className={
    "warning" + (dismissed && !isHarmful ? " closed" : "")
  }>
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
          <b>PROCEED WITH CAUTION!</b> This app has not yet been reviewed and declared
          as safe yet by the community, and therefore cannot be guaranteed to be
          free from phishing attempts and free from inappropriate content.
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
      </div>
    )}
  </div>
}


export const actions = {
  "closeWarning": function() {
    this.setState({dismissed: "true"});
    this.setSessionStorageItem("dismissed", "true");
  },
  "openWarning": function() {
    this.setState({dismissed: undefined});
    this.removeSessionStorageItem("dismissed");
  }
};