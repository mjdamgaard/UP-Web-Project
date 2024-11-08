import {useState, useMemo, useContext} from "react";
import {useDispatch} from "../../../../hooks/useDispatch";
import {DataFetcher} from "../../../../classes/DataFetcher.js";

import {ClassSubpage, MembersPage} from "./ClassSubpage.js";

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
    initTabKeys, initInd = 0,
    defaultTabType, defaultPageType, defaultPageProps,
    tabScaleKeys, getTabKeyFromEntID,
  } = props;

  const userID = "1"; // (TODO: Remove.)
  const initTabKey = initTabKeys[initInd];

  // Tabs are arrays of: [entID, tabType, pageType, pageProps].
  // Tab keys are the corresponding JSON arrays. 

  const [state, setState] = useState({
    tabKeyList: initTabKeys,
    curTabKey: initTabKey,
    loadedTabKeys: [initTabKey],
    tabsAreFetched: !tabScaleKeys,
  });

  const [dispatch, refCallback] = useDispatch(
    subpagesWithTabsActions, setState, state, props
  );

  useMemo(() => {
    if (!tabScaleKeys || state.tabsAreFetched) {
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
          tabsAreFetched: true,
        }));
      }
    );
  }, []);


  const subpages = state.loadedTabKeys.map((tabKey) => {
    let tab = JSON.parse(tabKey);
    let entID = tab[0];
    let PageComponent = tab[2] ? getPageComponent(tab[2]) :
      getPageComponent(defaultPageType);
    let pageProps = tab[3] ?? defaultPageProps;
    let curTabKey = state.curTabKey;
    let styleProps = tabKey == curTabKey ? {} : {style: {display: "none"}};
    return (
      <div key={tabKey} {...styleProps}>
        <PageComponent entID={entID} {...pageProps} />
      </div>
    );
  });

  const tabs = state.tabKeyList.map((tabKey) => {
    let tab = JSON.parse(tabKey);
    let entID = tab[0];
    let tabType = tab[1] ?? defaultTabType;
    let curTabKey = state.curTabKey;
    let isLoaded = state.loadedTabKeys.includes(tabKey);
    let isOpen = tabKey === curTabKey;
    return (
      <Tab key={tabKey} tabKey={tabKey}
        entID={entID} tabType={tabType} isLoaded={isLoaded} isOpen={isOpen} 
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

const Tab = ({tabKey, entID, tabType, isLoaded, isOpen}) => {
  const [state, setState] = useState({
    title: false, // null means missing or invalid.
  });
  const {title} = state;

  const [dispatch] = useDispatch();

  useMemo(() => {
    // If tabType is a 'relation' or 'class' type, fetch a JSON entity and
    // display its 'Title' attribute or its 'Name' attribute, respectively.
    if (tabType === "relation" || tabType === "class") {
      DataFetcher.fetchPublicSmallEntity(
        entID, (datatype, defStr, len, creatorID, isContained) => {
          // If the entity is not a (contained) JSON entity, set title as
          // missing/invalid (null).
          if (datatype !== "j" || !isContained) {
            setState(prev => ({
              ...prev,
              title: null,
            }));
            return;
          }
          // Else if the JSON is invalid, do the same.
          var defObj;
          try {
            defObj = JSON.parse(defStr);
          } catch (error) {
            setState(prev => ({
              ...prev,
              title: null,
            }));
            return;
          }
          // Else if set the title as either the relation's 'Title' attribute
          // value, or, if typeType is instead 'class,' its 'Name' attribute.
          setState(prev => {
            return {
              ...prev,
              title: (tabType === "class" ? defObj.Name : defObj.Title) || null,
            };
          });
        }
      );
    }
    else if (tabType === "all-members") {
      setState(prev => {
        return {
          ...prev,
          title: "All",
        };
      });
    }
  }, []);

  var tabContent;
  if (!title) {
    if (title === null) {
      tabContent = <span className="tab-title missing"></span>;
    }
    else {
      tabContent = <span className="tab-title loading"></span>;
    }
  }
  else {
    tabContent = <span className="tab-title">{title}</span>
  }
  return (
    <div className={isLoaded ? "tab loaded" : isOpen ? "tab open" : "tab"}
      onClick={(event) => {
        dispatch(event.target, "OPEN_TAB", tabKey);
      }}
    >
      {tabContent}
    </div>
  );
}


const subpagesWithTabsActions = {
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
    case "members-list":
      return MembersPage;
    default:
      break;
  }
}