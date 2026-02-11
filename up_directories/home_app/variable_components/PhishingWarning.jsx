
import * as InputCheckbox from 'InputCheckbox.jsx';
import * as Label from 'Label.jsx';

// TODO: Also fetch some 'Is Trusted' score for the component entity,
// and only show the warning if the component is not sufficiently
// trusted (looking at both the score itself and its weight, of course).

export function render() {
  let {cbRemIDKey} = this.state;

  return <div className="phishing-warning">
    <div className="warning">
      <p>{
        "This user-made component has not yet been reviewed and deemed to " +
        "be trusted by the user community."
      }</p>
      <p>{
        "UP-Web.org can therefore not guarantee that it does not contain any " +
        "phishing attempts, or any other kind of mischievous content."
      }</p>
      <p>{
        "No not give up any sensitive " +
        "information to the component, unless you really trust its creators."
      }</p>
      <p>{
        "Also be aware that the content might be inappropriate for sensitive " +
        "users. Therefore you also have to be 18 years or older to proceed."
      }</p>
    </div>
    <div className="dismissal-option">
      <div>
        <Label key="l-rem" forKey={cbRemIDKey}>{
        "Do not warn against this component again"
        }</Label>
        {" "}
        <InputCheckbox key="cb-rem" idKey={cbRemIDKey} />
      </div>
      <button onClick={() => this.do("dismissWarning")}>{"Accept"}</button>
    </div>
  </div>;
}


export function initialize() {
  let cbRemIDKey = Symbol("cbRemIDKey");
  return {cbRemIDKey: cbRemIDKey};
}


export const actions = {
  "dismissWarning": function() {
    let doNotWarnAgain = this.call("cb-rem", "getIsChecked");
    this.trigger("dismissWarning", doNotWarnAgain);
  }
};