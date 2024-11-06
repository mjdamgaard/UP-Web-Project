import {useState, useMemo, useContext} from "react";
import {useDispatch} from "../../../hooks/useDispatch";

/* Placeholders */
const TabHeader = () => <template></template>;



export const PagesWithTabs = (props) => {
  const {initTabs, defaultTab, entID, scaleKeysForMoreTabs} = props;

  // Tabs are defined by primitive types, but this can include JSON strings.
  // A numerical tab is interpreted as a Relation ID, yielding a Scale domain
  // together with entID is the Object. ...No, that depends on the definition
  // of the 'More tabs' tab..

  const [state, setState] = useState({
    tabList: initTabs,
    curTab: defaultTab,
    loadedPages: [defaultTab],
  });

  const [refCallback, dispatch] = useDispatch(
    pwtActions, setState, state, props
  );

  // Let's just load the default tab for now:


  const pages = state.loadedPages.map((tab) => (
    <div key={tab}
      style={tab == curTab ? {} : {display: "none"}}
    >
      {isLoadedArr[ind] ? val[1] : <></>}
    </div>
  ));

  return (
    <div ref={refCallback} className="pages-with-tabs variable-tabs">
      <div className="tab-header">
        {tabs}
        <div className="more-tabs-button">
        </div>
      </div>
      {pages}
    </div>
  );
};
