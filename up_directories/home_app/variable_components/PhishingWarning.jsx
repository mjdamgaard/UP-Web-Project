
// TODO: Also fetch some 'Is Trusted' score for the component entity,
// and only show the warning if the component is not sufficiently
// trusted (looking at both the score itself and its weight, of course).

export function render({entKey, localStorage, sessionStorage}) {
  let hasBeenDismissed;
  if (localStorage) {
    let dismissedComponentKeys = localStorage.getItem(entKey) ?? [];
    // ...
  }
  return <div className="phishing-warning">
    <div className="warning">{
      "TODO: Insert phishing warning here."
    }</div>
    <div className="dismissal-question">{
      "TODO: Insert button and checkbox to dismiss the warning here."
    }</div>
  </div>;
}