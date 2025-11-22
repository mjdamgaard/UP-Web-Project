
import * as InputCheckbox from 'InputCheckbox.jsx';
import * as Label from 'Label.jsx';

// TODO: Also fetch some 'Is Trusted' score for the component entity,
// and only show the warning if the component is not sufficiently
// trusted (looking at both the score itself and its weight, of course).

export function render() {
  let {idKey} = this.state;

  return <div className="phishing-warning">
    <div className="warning">
      <p>{
        "This user-made component has not yet been evaluated as a trusted " +
        "by the user community, or is still under development."
      }</p>
      <p>{
        "UP-Web.org therefore does not guarantee that it doesn't contain " +
        "phishing attempts, or other mischievous content."
      }</p>
      <p>{
        "No not give up any sensitive " +
        "information to the component, unless you trust its creators."
      }</p>
      <p>{
        "And be aware that the content might be inappropriate for sensitive " +
        "users."
      }</p>
    </div>
    <div className="dismissal-option">
      <div>
        <Label key="l" forKey={idKey}>{
        "Do not warn against this component again"
        }</Label>
        <InputCheckbox key="c" idKey={idKey} />
      </div>
      <button onClick={() => this.do("dismissWarning")}>{"Accept"}</button>
    </div>
  </div>;
}


export function getInitialState() {
  let idKey = Symbol("idKey");
  return {idKey: idKey};
}


export const actions = {
  "dismissWarning": function() {
    let doNotWarnAgain = this.call("c", "getIsChecked");
    this.trigger("dismissWarning", doNotWarnAgain);
  }
};