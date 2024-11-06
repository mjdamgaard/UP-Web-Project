import {useState, useMemo, useContext} from "react";
import {useDispatch} from "../../../../hooks/useDispatch";

/* Placeholders */
const TabHeader = () => <template></template>;



export const SubpagesWithTabs = (props) => {
  const {initTabs, defaultTab, entID, classID, scaleKeysForMoreTabs} = props;

  // Tabs are arrays of: [tabTitle, pageType, pageProps].

  const defaultTabKey = JSON.stringify(defaultTab);

  const [state, setState] = useState({
    tabList: moreTabsTab ? [...initTabs, moreTabsTab] : initTabs,
    curTabKey: defaultTabKey,
    loadedSubpages: [defaultTabKey],
  });

  const [refCallback, dispatch] = useDispatch(
    pwtActions, setState, state, props
  );



  const subpages = state.loadedSubpages.map((tab) => {
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
    let loadedSubpages = state.loadedSubpages;
    return (
      <div key={tabKey}
        className={!loadedSubpages.includes(tabKey) ? "tab" :
          tabKey === curTabKey ? "tab open" : "tab loaded"
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
    <div ref={refCallback} className="subpages-with-tabs">
      <div className="tab-list">
        {tabs}
      </div>
      <div className="subpage-container">
        {subpages}
      </div>
    </div>
  );
};
