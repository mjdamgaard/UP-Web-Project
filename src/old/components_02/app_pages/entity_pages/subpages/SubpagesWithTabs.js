import {useState, useMemo, useRef} from "react";
import {useDispatch} from "../../../../hooks/useDispatch.js";
import {DataFetcher} from "../../../../classes/DataFetcher.js";

import {ClassSubpage} from "./ClassSubpage.js";
import {MoreTabsSubpage} from "./MoreTabsSubpage.js";

/* Placeholders */
// const MoreTabsSubpage = () => <template></template>;

const IS_FETCHING = {};


// TODO: Make the previously selected tab stand out when going to the more tabs
// page.


export const SubpagesWithTabs = (props) => {
  var {
    initTabsJSON, getPageCompFromID, tabScaleKeysJSON, tabBarHeader,
    getTabTitleFromID, initTabID, italicizeFirstTab, startAsCollapsed
  } = props;

  if (typeof getTabTitleFromID === "string") {
    let attrName = getTabTitleFromID;
    getTabTitleFromID = (entID, callback) => {
      fetchEntityAttribute(entID, attrName, callback);
    };
  }

  const userID = "1"; // (TODO: Remove.)


  const [state, setState] = useState(() => {
    let initTabs = JSON.parse(initTabsJSON ?? "[]");
    initTabID = initTabID ?? (initTabs[0] && initTabs[0][0]);
    let tabIDArr = initTabs.map(val => val[0]);
    if (!tabIDArr.includes(initTabID)) {
      tabIDArr.push(initTabID);
    }
    return {
      tabIDArr: tabIDArr,
      tabTitleStore: Object.fromEntries(initTabs),
      curTabID: initTabID,
      loadedTabIDs: [initTabID],
      tabsAreFetched: !tabScaleKeysJSON,
      moreTabsSubpageIsLoaded: false,
      isCollapsed: startAsCollapsed,
    }
  });
  const {
    tabIDArr, tabTitleStore, curTabID, loadedTabIDs, tabsAreFetched,
    moreTabsSubpageIsLoaded, isCollapsed,
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
      userID, tabScaleKeys, 20, 8, 10, (entLists) => {
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

  // Fetch any not-yet-gotten tab titles of the visible tabs.
  useMemo(() => {
    tabIDArr.forEach(tabID => {
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
  }, [JSON.stringify(tabIDArr)]);

  // Construct the (visible) tab JSX elements.
  const tabs = tabIDArr.map((tabID) => {
    let tabTitle = tabTitleStore[tabID];
    let isFetching = tabTitle === IS_FETCHING;
    let isMissing = tabTitle === null;
    let isLoaded = loadedTabIDs.includes(tabID);
    let isOpen = tabID == curTabID;
    let isItalic = italicizeFirstTab && tabID == tabIDArr[0];
    return (
      <div key={tabID}
        className={"tab" +
            (isFetching ? " fetching" : "") +
            (isMissing  ? " missing"  : "") +
            (isLoaded   ? " loaded"   : "") +
            (isOpen     ? " open"     : "")
        }
        onClick={(event) => {
          dispatch(event.target, "OPEN_TAB", tabID);
        }}
      >
        {isFetching ? "" : isItalic ? <i>{tabTitle}</i> : tabTitle}
      </div>
    );
  });

  // Construct the subpage JSX elements.
  const subpages = loadedTabIDs.map((tabID) => {
    let [PageComponent, pageProps] = getPageCompFromID(tabID);
    let styleProps = tabID == curTabID ? {} : {style: {display: "none"}};
    return (
      <div key={tabID} className="subpage" {...styleProps}>
        <PageComponent tabID={tabID} {...pageProps} />
      </div>
    );
  });

  const moreTabsSubpage = !moreTabsSubpageIsLoaded ? <></> : (
    <div key={"more-tabs"} className="more-tabs-page"
      {...(curTabID === "more-tabs" ? {} : {style: {display: "none"}})}
    >
      <MoreTabsSubpage tabScaleKeysJSON={tabScaleKeysJSON} />
    </div>
  );

  return (
    <div ref={refCallback} className="subpages-with-tabs">
      <div className={
        "tab-bar" + (tabsAreFetched ? "" : " fetching") +
        (isCollapsed ? " collapsed" : "")
      }>
        <div className="tab-bar-header">
          <button type="button"  className="collapse-expand-button"
            onClick={(event) => {
              dispatch(event.target, "EXPAND_OR_COLLAPSE_TAB_BAR");
            }}
          >
          </button>
          <div className="header">
            {tabBarHeader}
          </div>
        </div>
        <div className="tab-list">
          {tabs}
        </div>
        <button type="button" className="more-tabs-button"
          {...(tabScaleKeysJSON ? {} : {disabled: true})}
          onClick={(event) => {
            dispatch(event.target, "OPEN_MORE_TABS_PAGE");
          }}
        >
        </button>
      </div>
      <hr/>
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
      return {
        ...prev,
        loadedTabIDs: prev.loadedTabIDs.includes(tabID) ? prev.loadedTabIDs :
          [...prev.loadedTabIDs, tabID],
        curTabID: tabID,
      };
    });
  },
  "OPEN_MORE_TABS_PAGE": function(_, setState, {state}) {
    setState(prev => {
      return {
        ...prev,
        moreTabsSubpageIsLoaded: true,
        curTabID: "more-tabs",
      };
    });
  },
  "ADD_AND_OPEN_TAB": function(tabID, setState) {
    setState(prev => {
      return {
        ...prev,
        tabIDArr: prev.tabIDArr.includes(tabID) ? prev.tabIDArr :
          [...prev.tabIDArr, tabID],
        loadedTabIDs: prev.loadedTabIDs.includes(tabID) ? prev.loadedTabIDs :
          [...prev.loadedTabIDs, tabID],
        curTabID: tabID,
      };
    });
  },
  "EXPAND_OR_COLLAPSE_TAB_BAR": function(_, setState, {state}) {
    setState(prev => {
      return {
        ...prev,
        isCollapsed: !prev.isCollapsed,
      };
    });
  },
}





function getUnionedParsedAndSortedEntList(entLists) {
  let unionedAndParsedEntList = [].concat(...entLists).map(val => {
    return [parseFloat(val[0]), val[1]];
  });
  return unionedAndParsedEntList.sort((a, b) => b[0] - a[0]);
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
