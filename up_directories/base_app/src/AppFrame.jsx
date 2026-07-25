
import * as AppLoader from "./AppLoader.jsx";

export function render({baseAppPage, appLoaderProps}) {
  return (
    <div className="app-frame">
      <div className={"base-app-page" + (baseAppPage ? "" : " hidden")}>
        {(baseAppPage)}
      </div>
      {(appLoaderProps ? <AppLoader key="l" {...appLoaderProps} /> : undefined)}
    </div>
  );
}
