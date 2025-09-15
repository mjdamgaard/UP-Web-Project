
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
          let {title} = tabData
          return <Tab key={"t-" + tabKey} tabKey={tabKey} children={title}
            isOpen={tabKey === openTabKey} isLoaded={loadedTabs[tabKey]}
          />;
        })
      }</div>
      <div className="page-container">{
        map(loadedPageEntries, ([tabKey, tabData]) => {
          if (!tabData) return undefined;
          let {Component, props: pageProps} = tabData;
          return <div className="page">
            <Component key={"p-" + tabKey}
              isOpen={tabKey === openTabKey} {...pageProps}
            />
          </div>;
        })
      }</div>
    </div>
  );
}


export function getInitState({tabs, initTabKey = undefined}) {
  return new {
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
    let {loadedPages, openTabKey: prevOpenTabKey} = this.state.loadedPages;
    if (!loadedPages[tabKey]) {
      loadedPages = {...loadedPages, [tabKey]: tabs[tabKey]};
    }
    this.setState({
      ...this.state, openTabKey: tabKey, loadedPages: loadedPages
    });

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
      let loadedPageEntries = entries(loadedPages);
      let newTabKey = "";
      forEach(loadedPageEntries, ([loadedTabKey, tabData]) => {
        if (tabData) newTabKey = loadedTabKey;
      });
      openTabKey = newTabKey;
    }
    this.setState({
      ...this.state, openTabKey: openTabKey, loadedPages: newLoadedPages
    });
  },
};


export const events = [
  "open-tab",
  "close-tab",
];
