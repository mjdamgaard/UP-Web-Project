import {useState, createContext, useContext, useEffect, useMemo} from "react";

/* Placeholders */
// const TabHeader = () => <template></template>;


// tabDataArr: [tabTitle, jsxElement].

export const PagesWithTabs = ({tabDataArr, initTab}) => {
  const [activeTab, setActiveTab] = useState(initTab);
  const [isLoadedArr, setIsLoadedArr] = useState(tabDataArr.map(
    val => val[0] === initTab
  ));
  const tabsManager = useMemo(() => (
    new TabsManager(tabDataArr, setActiveTab, setIsLoadedArr)
  ), [tabDataArr]);

  const tabTitles = tabDataArr.map(val => val[0]);

  const pages = tabDataArr.map((val, ind) => (
    <div key={val[0]}
      style={{display: val[0] === activeTab ? "" : "none"}}
    >
      {isLoadedArr[ind] ? val[1] : <></>}
    </div>
  ));

  return (
    <div className="pages-with-tabs">
      <TabHeader
        tabTitles={tabTitles}
        activeTab={activeTab}
        isLoadedArr={isLoadedArr}
        tabsManager={tabsManager}
      />
      <div className="pages-container">
        {pages}
      </div>
    </div>
  );
};

class TabsManager {
  constructor(tabDataArr, setActiveTab, setIsLoadedArr) {
    this.tabTitles = tabDataArr.map(val => val[0]);
    this.setActiveTab = setActiveTab;
    this.setIsLoadedArr = setIsLoadedArr;
  }

  openTab = (tabTitle) => {
    let ind = this.tabTitles.findIndex(t => t === tabTitle);
    if (ind >= 0) {
      this.setIsLoadedArr(prev => {
        let ret = [...prev];
        ret[ind] = true;
        return ret;
      });
      this.setActiveTab(tabTitle);
    }
  };
  closeTab = (tabTitle) => {
    let ind = this.tabTitles.findIndex(t => t === tabTitle);
    if (ind >= 0) {
      this.setIsLoadedArr(prev => {
        let ret = [...prev];
        ret[ind] = false;
        return ret;
      });
      this.setActiveTab(prev => tabTitle === prev ? "" : prev);
    }
  };
}


export const TabHeader = ({tabTitles, activeTab, isLoadedArr, tabsManager}) => {
  const tabs = tabTitles.map((val, ind) => (
    <li key={val} onClick={() => {
      tabsManager.openTab(val);
      // e.stopPropagation();
    }}>
      <CloseTabButton
        tabsManager={tabsManager}
        tabTitle={val}
        isVisible={isLoadedArr[ind]}
      />
      <a className={"nav-link" + (val === activeTab ? " active" : "")} href="#">
        {val}
      </a>
    </li>
  ));

  return (
    <div className="tab-header">
      <ul className="nav nav-tabs">
        {tabs}
      </ul>
    </div>
  );
};

export const CloseTabButton = ({tabsManager, tabTitle, isVisible}) => {
  return (
    <button type="button" className="close"
      style={{visibility: isVisible ? "visible" : "hidden"}}
      onClick={(e) => {
        if (isVisible) {
          tabsManager.closeTab(tabTitle);
        }
        e.stopPropagation();
      }}
    >
      <span>&times;</span>
    </button>
  );
};
