import {useState, useMemo, useContext} from "react";
import {useDispatch} from "../../../hooks/useDispatch";

/* Placeholders */
const TabHeader = () => <template></template>;



export const PagesWithTabs = (props) => {
  const {initTabs, defaultTab, entID, classID, scaleKeysForMoreTabs} = props;

  // Tabs are arrays of: [tabTitle, pageType, pageProps].

  const defaultTabKey = JSON.stringify(defaultTab);

  const [state, setState] = useState({
    tabList: moreTabsTab ? [...initTabs, moreTabsTab] : initTabs,
    curTabKey: defaultTabKey,
    loadedPages: [defaultTabKey],
  });

  const [refCallback, dispatch] = useDispatch(
    pwtActions, setState, state, props
  );



  const pages = state.loadedPages.map((tab) => {
    let tabKey = JSON.stringify(tab);
    let curTabKey = state.curTabKey;
    let PageComponent = getPageComponent(tab[1]);
    let pageProps = tab[2] ?? {};
    return (
      <div key={tabKey}
        style={tabKey == curTabKey ? {} : {display: "none"}}
      >
        <PageComponent {...pageProps} />
      </div>
    );
  });

  const tabs = state.tabList.map((tab) => {
    let tabKey = JSON.stringify(tab);
    let tabTitle = tab[0];
    let curTabKey = state.curTabKey;
    let loadedPages = state.loadedPages;
    return (
      <div key={tabKey}
        className={!loadedPages.includes(tabKey) ? "" :
          tabKey === curTabKey ? "open" : "loaded"
        }
        onClick={() => {
          // TODO: Implement.
        }}
      >
        {tabTitle}
      </div>
    );
  });

  return (
    <div ref={refCallback} className="pages-with-tabs variable-tabs">
      <div className="tab-header">
        {tabs}
      </div>
      <div className="page-container">
        {pages}
      </div>
    </div>
  );
};
