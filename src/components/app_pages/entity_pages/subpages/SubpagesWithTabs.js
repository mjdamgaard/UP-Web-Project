import {useState, useMemo, useContext} from "react";
import {useDispatch} from "../../../../hooks/useDispatch";
import {DataFetcher} from "../../../../classes/DataFetcher.js";

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
  const {
    initTabKeys, defaultTabKey,
    defaultPageType, defaultPageProps,
    tabScaleKeys, getTabKeyFromEntID,
  } = props;

  const userID = "1"; // (TODO: Remove.)

  // Tabs are arrays of: [tabProps, pageType, pageProps]. Tab keys are the
  // corresponding JSON arrays. 

  const [state, setState] = useState({
    tabKeyList: initTabKeys,
    curTabKey: defaultTabKey,
    loadedTabKeys: [defaultTabKey],
    topTabsAreFetched: false,
  });

  const [refCallback, dispatch] = useDispatch(
    subpagesWTActions, setState, state, props
  );

  useMemo(() => {
    if (!tabScaleKeys || state.topTabsAreFetched) {
      return;
    }
    DataFetcher.fetchSeveralEntityLists(
      userID, tabScaleKeys, 20, (entLists, scaleIDs) => {
        let fetchedTabEntList = getUnionedParsedAndSortedEntList(entLists);
        let fetchedTabList = fetchedTabEntList
          .slice(0, 20)
          .map(val => getTabKeyFromEntID(val[1]));
  
        setState(prev => ({
          ...prev,
          tabKeyList: [...prev.tabKeyList, ...fetchedTabList],
          topTabsAreFetched: true,
        }));
      }
    );
  });


  const subpages = state.loadedTabKeys.map((tabKey) => {
    let tab = JSON.parse(tabKey);
    let PageComponent = tab[1] ? getPageComponent(tab[1]) :
      getPageComponent(defaultPageType);
    let pageProps = tab[2] ?? defaultPageProps;
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
    let tabProps = tab[0];
    let curTabKey = state.curTabKey;
    let isLoaded = state.loadedTabKeys.includes(tabKey);
    let isOpen = tabKey === curTabKey;
    return (
      <Tab key={tabKey}
        {...tabProps} tabKey={tabKey} isLoaded={isLoaded} isOpen={isOpen} 
      />
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

const Tab = ({isLoaded, isOpen, tabKey}) => {
  const [, dispatch] = useDispatch();

  return (
    <div className={isLoaded ? "tab loaded" : isOpen ? "tab open" : "tab"}
      onClick={(event) => {
        dispatch(event.target, "OPEN_TAB", tabKey);
      }}
    >
      {tabKey}
    </div>
  );
}


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