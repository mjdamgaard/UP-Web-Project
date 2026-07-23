
// This component wraps the AppLoader component in order to handle when the
// the triggers events of loading untrusted apps. 

import * as AppLoader from "./AppLoader.jsx";

export function render({children}) {
  let {displayWarning} = this.state;
  return (
    <div className="wrapper">
      <div className="warning-container">
        {/* TODO... */}
      </div>
      {(children)}
    </div>
  );
}
