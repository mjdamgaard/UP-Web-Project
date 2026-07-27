
// This component wraps the AppLoader component in order to handle when the
// the triggers events of loading untrusted apps. 

import * as AppLoader from "./AppLoader.jsx";

export function render({children, trustClass, appDirID, appDirIDSegment}) {
  let {displayWarning} = this.state;
  return (
    <div className="app-wrapper">
      <div className="warning-container">
        {/* TODO... */}
      </div>
      {(children)}
    </div>
  );
}
