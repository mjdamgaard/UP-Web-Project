import {useState, useMemo, useRef} from "react";
import {useDispatch} from "../../../../hooks/useDispatch";
import {DataFetcher} from "../../../../classes/DataFetcher.js";

import {ClassSubpage, MembersPage} from "./ClassSubpage.js";

/* Placeholders */
const MoreTabsSubpage = () => <template></template>;


const IS_FETCHING = {};


function getUnionedParsedAndSortedEntList(entLists) {
  let unionedAndParsedEntList = [].concat(...entLists).map(val => {
    return [parseFloat(val[0]), val[1]];
  });
  return unionedAndParsedEntList.sort((a, b) => b[0] - a[0]);
} 



export const SubpagesWithTabs = (props) => {
  const {
    initTabsJSON, getPageCompFromID, getTabTitleFromID,
    tabScaleKeysJSON, initIsExpanded = false,
  } = props;
  if (typeof getTabTitleFromID === "string") {
    let attrName = getTabTitleFromID;
    getTabTitleFromID = (entID, callback) => {
      fetchEntityAttribute(entID, attrName, callback);
    };
  }

  const userID = "1"; // (TODO: Remove.)

  const initTabs = JSON.parse(initTabsJSON);

  // initTabsJSON is a JSON array of: [[tabTitle, tabID]*].
  // Tab keys are the corresponding JSON arrays. 

  const [state, setState] = useState({
    tabIDArr: initTabs.map(val => val[1]),
    tabTitleStore: Object.fromEntries(initTabs),
    curTabID: 0,
    loadedTabIDs: [initTabs[0][1]],
    tabsAreFetched: !tabScaleKeysJSON,
    isExpanded: initIsExpanded,
    moreTabsSubpageIsLoaded: false,
  });
  const {
    tabIDArr, tabTitleStore, curTabID, loadedTabIDs, tabsAreFetched,
    isExpanded, moreTabsSubpageIsLoaded
  } = state;

  const [dispatch, refCallback] = useDispatch(
    subpagesWithTabsActions, setState, state, props, null, 
  );

  // On first render, fetch a few more tabs if any tabScaleKeys are provided.
  useMemo(() => {
    if (tabsAreFetched) {
      return;
    }
    let tabScaleKeys = JSON.parse(tabScaleKeysJSON);
    DataFetcher.fetchSeveralEntityLists(
      userID, tabScaleKeys, 20, (entLists, scaleIDs) => {
        let fetchedTabEntList = getUnionedParsedAndSortedEntList(entLists);
        let fetchedTabIDs = fetchedTabEntList.map(val => val[1]);
        setState(prev => ({
          ...prev,
          tabIDArr: [...new Set([...prev.tabIDArr, ...fetchedTabIDs])],
          tabsAreFetched: true,
        }));
      }
    );
  }, []);


  const visibleTabIDs = [...new Set(loadedTabIDs.concat(tabIDArr))]
    .slice(0, isExpanded ? 20 : 6);

  // Fetch any not-yet-gotten tab titles of the visible tabs.
  useMemo(() => {
    visibleTabIDs.forEach(tabID => {
      if (!tabTitleStore[tabID]) {
        tabTitleStore[tabID] = IS_FETCHING;
        getTabTitleFromID(tabID, (title => {
          setState(prev => ({
            ...prev,
            tabTitleStore: {...prev.tabTitleStore, [tabID]: title},
          }));
        }));
      }
    });
  }, [JSON.stringify(visibleTabIDs)]);

  // Construct the (visible) tab JSX elements.
  const tabs = visibleTabIDs.map((tabID) => {
    let tabTitle = tabTitleStore[tabID];
    let isFetching = tabTitle === IS_FETCHING;
    let isMissing = tabTitle === null;
    let isLoaded = loadedTabIDs.includes(tabID);
    let isOpen = tabID === curTabID;
    return (
      <div
        className={"tab" +
            (isFetching ? " fetching" : "") +
            (isMissing  ? " missing"  : "") +
            (isLoaded   ? " loaded"   : "") +
            (isOpen     ? " open"     : "")
        }
        onClick={(event) => {
          dispatch(event.currentTarget, "OPEN_TAB", tabID);
        }}
      >
        {tabContent}
      </div>
    );
  });

  // Construct the subpage JSX elements.
  const subpages = loadedTabIDs.map((tabID) => {
    let [PageComponent, pageProps] = getPageCompFromID(tabID);
    let styleProps = tabID == curTabID ? {} : {style: {display: "none"}};
    return (
      <div key={tabID} {...styleProps}>
        <PageComponent tabID={tabID} {...pageProps} />
      </div>
    );
  });

  const moreTabsSubpage = !moreTabsSubpageIsLoaded ? <></> : (
    <div key={"more-tabs"}
      {...(curTabID === "more-tabs" ? {} : {style: {display: "none"}})}
    >
      <MoreTabsSubpage tabScaleKeysJSON={tabScaleKeysJSON} />
    </div>
  );


  return (
    <div ref={refCallback} className="subpages-with-tabs">
      <div className={"tab-list" + (tabsAreFetched ? "" : " fetching")}>
        {tabs}
      </div>
      <div className="subpage-container">
        {subpages}
        {moreTabsSubpage}
      </div>
    </div>
  );
};



const subpagesWithTabsActions = {
  "OPEN_TAB": function(tabID, setState, {state}) {
    setState(prev => {
      let loadedTabIDs = prev.loadedTabIDs;
      return {
        ...prev,
        loadedTabIDs: loadedTabIDs.includes(tabID) ? loadedTabIDs :
          [tabID, ...loadedTabIDs],
        curTabID: tabID,
      };
    })
  },
}




export function fetchEntityAttribute(entID, attrName, callback) {
  DataFetcher.fetchPublicSmallEntity(
    entID, (datatype, defStr, len, creatorID, isContained) => {
      // If the entity is not a (contained) JSON entity, return title as
      // missing/invalid (null).
      if (datatype !== "j" || !isContained) {
        callback(null);
        return;
      }
      // Else if the JSON is invalid, do the same.
      var defObj;
      try {
        defObj = JSON.parse(defStr);
      } catch (error) {
        callback(null);
        return;
      }
      // Else return the title as either the value of the attribute of
      // attrName.
      callback(defObj[attrName]);
    }
  );
}


function getPageComponent(pageType) {
  switch (pageType) {
    case "class":
      return ClassSubpage;
    case "members-list":
      return MembersPage;
    default:
      break;
  }
}