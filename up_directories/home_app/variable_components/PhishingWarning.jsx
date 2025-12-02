
import * as InputCheckbox from 'InputCheckbox.jsx';
import * as Label from 'Label.jsx';

// TODO: Also fetch some 'Is Trusted' score for the component entity,
// and only show the warning if the component is not sufficiently
// trusted (looking at both the score itself and its weight, of course).

export function render() {
  let {cbRemIDKey, cbAgeIDKey} = this.state;

  return <div className="phishing-warning">
    <div className="warning">
      <p>{
        "This user-made component has not yet been evaluated as a trusted " +
        "by the user community, or is still under development."
      }</p>
      <p>{
        "UP-Web.org therefore does not guarantee that it does not contain " +
        "phishing attempts, or other mischievous content."
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
        <InputCheckbox key="cb-rem" idKey={cbRemIDKey} />
      </div>
      <div>
        <Label key="l-age" forKey={cbAgeIDKey}>{
        "I am 18 years or older"
        }</Label>
        <InputCheckbox key="cb-age" idKey={cbAgeIDKey} />
      </div>
      <button onClick={() => this.do("dismissWarning")}>{"Accept"}</button>
    </div>
  </div>;
}


export function getInitialState() {
  let cbRemIDKey = Symbol("cbRemIDKey");
  let cbAgeIDKey = Symbol("cbAgeIDKey");
  return {cbRemIDKey: cbRemIDKey, cbAgeIDKey: cbAgeIDKey};
}


export const actions = {
  "dismissWarning": function() {
    if (!this.call("cb-age", "getIsChecked")) return;
    let doNotWarnAgain = this.call("cb-rem", "getIsChecked");
    this.trigger("dismissWarning", doNotWarnAgain);
  }
};