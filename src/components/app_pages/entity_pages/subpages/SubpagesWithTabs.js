import {useState, useMemo, useContext} from "react";
import {useDispatch} from "../../../../hooks/useDispatch";

import {ClassSubpage} from "./ClassSubpage.js";

/* Placeholders */
const TabHeader = () => <template></template>;


function getUnionedParsedAndSortedEntList(entLists) {
  let unionedAndParsedEntList = [].concat(...entLists).map(val => {
    return [parseFloat(val[0]), val[1]];
  });
  return unionedAndParsedEntList.sort((a, b) => b[0] - a[0]);
} 

export const SubpagesWithTabs = (props) => {
  const {initTabKeys, defaultTabKey, entID, classID, tabScaleKeys} = props;

  // Tabs are arrays of: [tabTitle, pageType, pageProps]. Tab keys are the
  // corresponding JSON arrays. 

  const [state, setState] = useState({
    tabKeyList: initTabKeys,
    curTabKey: defaultTabKey,
    loadedTabKeys: [defaultTabKey],
    topTabEntList: null,
    topTabsAreFetched: false,
  });

  const [refCallback, dispatch] = useDispatch(
    subpagesWTActions, setState, state, props
  );

  useMemo(() => {
    if (state.topTabsAreFetched) {
      return;
    }
    DataFetcher.fetchSeveralEntityLists(
      userID, tabScaleKeys, 20, (entLists, scaleIDs) => {
        setState(prev => ({
          ...prev,
          topTabEntList: getUnionedParsedAndSortedEntList(entLists),
          topTabsAreFetched: true,
        }))
      }
    );
  });

  useMemo(() => {
    if (!state.topTabsAreFetched) {
      return;
    }
    DataFetcher.fetchSeveralEntities(
      state.topTabEntList.slice(0, 20), (results) => {
        // TODO: Construct tabs from the.. og wait, we should hand the entIDs
        // to a tab component instead, right?..
      }
    );

  }, [state.topTabsAreFetched ? true : false]);


  const subpages = state.loadedTabKeys.map((tabKey) => {
    let tab = JSON.parse(tabKey);
    let PageComponent = getPageComponent(tab[1]);
    let pageProps = tab[2] ?? {};
    let curTabKey = state.curTabKey;
    let styleProps = tabKey == curTabKey ? {} : {style: {display: "none"}};
    return (
      <div key={tabKey} {...styleProps}>
        <PageComponent {...pageProps} />
      </div>
    );
  });

  const tabs = state.tabKeyList.map((tabKey) => {
    let tab = JSON.parse(tabKey);
    let tabTitle = tab[0];
    let curTabKey = state.curTabKey;
    let loadedTabKeys = state.loadedTabKeys;
    return (
      <div key={tabKey}
        className={!loadedTabKeys.includes(tabKey) ? "tab" :
          tabKey === curTabKey ? "tab open" : "tab loaded"
        }
        onClick={(event) => {
          dispatch(event.target, "OPEN_TAB", tabKey);
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


const subpagesWTActions = {
  "OPEN_TAB": function(tabKey, setState, {state}) {
    setState(prev => {
      let loadedTabKeys = prev.loadedTabKeys;
      return {
        ...prev,
        loadedTabKeys: loadedTabKeys.includes(tabKey) ? loadedTabKeys :
          [...loadedTabKeys, tabKey],
        curTabKey: tabKey,
      };
    })
  },
}




function getPageComponent(pageType) {
  switch (pageType) {
    case "class":
      return ClassSubpage;
    default:
      break;
  }
}