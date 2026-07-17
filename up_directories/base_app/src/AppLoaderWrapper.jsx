
// This component wraps the AppLoader component in order to handle when the
// the triggers events of loading untrusted apps. 

import * as AppLoader from "./src/AppLoader.jsx";

export function render(props) {
  let {displayWarning} = this.state;
  return (
    <div className="app-loader-wrapper">
      <div className="warning-container">
        {/* TODO... */}
      </div>
      <AppLoader key="l" {...props} />
    </div>
  );
}
