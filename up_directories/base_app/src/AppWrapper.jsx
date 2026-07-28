
// This component wraps the AppLoader component in order to handle when the
// the triggers events of loading untrusted apps. 

import * as AppLoader from "./AppLoader.jsx";

export function render({
  children, trustClass, appDirID, isOriginal, isStandard, appDirIDSegment,
  style,
}) {
  let {displayWarning} = this.state;
  return (
    <div className="app-wrapper" innerStyle={style}>
      <div className="warning-container">
        {/* TODO... */}
      </div>
      {(children)}
    </div>
  );
}
