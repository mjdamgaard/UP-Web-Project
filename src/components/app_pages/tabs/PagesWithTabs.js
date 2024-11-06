import {useState, useMemo, useContext} from "react";
import {useDispatch} from "../../../hooks/useDispatch";

/* Placeholders */
const TabHeader = () => <template></template>;



export const PagesWithTabs = (props) => {
  const {initTabs, defaultTab, entID, classID, scaleKeysForMoreTabs} = props;

  // // Tabs are defined by primitive types, but this can include JSON strings.
  // // The 'more tabs' tab is supposed to be (defined by) a JSON string, which
  // // also "knows" how to construct new tabs from any entity selected in an
  // // EntityList under the tab.

  // Tabs are arrays of: [pageType, pageProps], where pageProps is an object.

  const defaultTabKey = JSON.stringify(defaultTab);

  const [state, setState] = useState({
    tabList: moreTabsTab ? [...initTabs, moreTabsTab] : initTabs,
    curTabKey: defaultTabKey,
    loadedPages: [defaultTabKey],
  });

  const [refCallback, dispatch] = useDispatch(
    pwtActions, setState, state, props
  );



  const pages = state.loadedPages.map((tab) => (
    <div key={tab}
      style={tab == curTab ? {} : {display: "none"}}
    >
      <PageUnderTab tab={tab}/>
    </div>
  ));

  return (
    <div ref={refCallback} className="pages-with-tabs variable-tabs">
      <div className="tab-header">
        {tabs}
        <div className="more-tabs-button">
        </div>
      </div>
      {pages}
    </div>
  );
};
