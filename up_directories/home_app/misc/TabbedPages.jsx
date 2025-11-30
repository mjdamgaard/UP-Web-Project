
import {entries} from 'object';
import {map, forEach} from 'array';

import * as Tab from "./Tab.jsx";

// tabs := {(<tabKey>: {title, Component, props},)*}.

export function render({tabs, closeInactiveTabs = undefined}) {
  closeInactiveTabs = closeInactiveTabs ??
    this.subscribeToContext("closeInactiveTabs") ?? false;
  let {openTabKey, loadedPages} = this.state;
  let tabEntries = entries(tabs);
  let loadedPageEntries = entries(loadedPages);

  return (
    <div className="tabbed-pages">
      <div className="tab-menu">{
        map(tabEntries, ([tabKey, tabData]) => {
          if (!tabData) return undefined;
          let {title} = tabData;
          return <Tab key={"t-" + tabKey} tabKey={tabKey} children={title}
            isOpen={tabKey === openTabKey} isLoaded={loadedPages[tabKey]}
          />;
        })
      }</div>
      <div className="page-container">{
        map(loadedPageEntries, ([tabKey, tabData]) => {
          if (!tabData) return undefined;
          let isOpen = tabKey === openTabKey;
          let {Component, props: pageProps} = tabData;
          return <div className={"page" + (isOpen ? " open" : "")}>
            <Component key={"p-" + tabKey} {...pageProps} />
          </div>;
        })
      }</div>
    </div>
  );
}


export function getInitialState({tabs, initTabKey}) {
  return {
    openTabKey: initTabKey,
    loadedPages: {[initTabKey]: tabs[initTabKey]},
  };
}




export const actions = {
  "open-tab": function(tabKey) {
    let {tabs} = this.props;
    let closeInactiveTabs = this.props.closeInactiveTabs ??
      this.subscribeToContext("closeInactiveTabs") ?? false;

    // Change openTabKey, and add a new entry to loadedPages if it has not
    // already been added.
    let {loadedPages, openTabKey: prevOpenTabKey} = this.state;
    if (!loadedPages[tabKey]) {
      loadedPages = {...loadedPages, [tabKey]: tabs[tabKey]};
    }
    this.setState(state => ({
      ...state, openTabKey: tabKey, loadedPages: loadedPages
    }));

    // If closeInactiveTabs is true, and prevOpenTabKey !== tabKey, close the
    // previous open tab.
    if (closeInactiveTabs && prevOpenTabKey !== tabKey) {
      this.trigger("close-tab", prevOpenTabKey);
    }
  },
  "close-tab": function(tabKey) {
    // Remove the tabKey's entry from loadedPages, and if tabKey is the
    // currently open tab, open the last entry in loadedPages. // TODO:
    // consider storing the previous open tab in order to go to that instead.
    // (One could also even implement using something similar to an LRU list.)
    let {openTabKey, loadedPages} = this.state;
    let newLoadedPages = {...loadedPages, [tabKey]: undefined};
    if (tabKey === openTabKey) {
      let loadedPageEntries = entries(newLoadedPages);
      let newTabKey = "";
      forEach(loadedPageEntries, ([loadedTabKey, tabData]) => {
        if (tabData) newTabKey = loadedTabKey;
      });
      openTabKey = newTabKey;
    }
    this.setState(state => ({
      ...state, openTabKey: openTabKey, loadedPages: newLoadedPages
    }));
  },
};


export const events = [
  "open-tab",
  "close-tab",
];




export const styleSheetPaths = [
  abs("./TabbedPages.css"),
];