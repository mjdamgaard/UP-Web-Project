import {useState, createContext, useContext, useMemo, useId, useEffect} from "react";
import {
  useStateAndReducers, useDispatch
} from "../../contexts_and_hooks/useStateAndReducers.js"

import {
  useLocation, Navigate,
} from "react-router-dom";


import {InterfaceHeader} from "../InterfaceHeader.js";
import {AppColumn} from "../app_columns/AppColumn.js";
import {ListGeneratorPage} from "../ListGenPages.js";

import {
  LazyDelayedPromiseOnceRest
} from "../../classes/LazyDelayedPromise.js";

/* Placeholders */
// const ListGeneratorPage = () => <template></template>;


export const HOME_ENTITY_ID = 12;



const mainPageReducers = {
  key: "main",
  "OPEN_COLUMN": ([state], [colSpec, callerColKey]) => {
    const {colKeyArr, specStore, nonce} = state;
    let callerColInd = colKeyArr.indexOf(callerColKey);
    let newNonce = nonce + 1;
    let newColKeyArr = (callerColInd === -1) ?
      colKeyArr.concat([newNonce]) :
      colKeyArr.slice(0, callerColInd + 1).concat(
        [newNonce], colKeyArr.slice(callerColInd + 1)
      )
    let newSpecStore = {...specStore, [newNonce]: colSpec};
    let newCurrInd = callerColInd + 1;
    return {
      ...state,
      colKeyArr: newColKeyArr,
      specStore: newSpecStore,
      nonce: newNonce,
      currInd: newCurrInd,
    };
  },

  "UPDATE_SCROLL": ([state], scrollLeft, dispatch) => {
    // Get the scroll velocity.
    const scrollVelocity = scrollLeft - state.scrollLeft;
    
    scrollEndPromise.then(() => {
      dispatch("self", "UPDATE_SCROLL_END", [scrollLeft, scrollVelocity]);
    });

    return {...state, scrollLeft: scrollLeft, scrollVelocity: scrollVelocity};
  },

  "UPDATE_SCROLL_END": ([state], [scrollLeft, scrollVelocity], dispatch) => {
    // Get the center positions of each app column.
    const columnContainer = document.querySelector(".column-container");
    const appColumnWrappers = document.querySelectorAll(
      "[id^=app-column-wrapper]"
    );
    const posArr = [];
    appColumnWrappers.forEach((element, ind) => {
      let {left, right} = element.getBoundingClientRect();
      posArr[ind] = (right - left) / 2;
    });

    // Get the center position of the column container.
    const {left, right} = columnContainer.getBoundingClientRect();
    const center = (right - left) / 2;

    // Get the first column in the scroll direction from the center of the
    // column container.
    const {colInd} = posArr.reduce((acc, val, ind) => {
      let offSetFromCenter = val - center;
      let absOffSet = Math.abs(offSetFromCenter);
      if (ind === 0) {
        return {absOffSet: absOffSet, colInd: 0}
      }
      else if (Math.sign(offSetFromCenter) !== Math.sign(scrollVelocity)) {
        return acc;
      }
      else if (absOffSet < acc.absOffSet) {
        return {absOffSet: absOffSet, colInd: ind};
      }
      else {
        return acc;
      }
    });
    // dispatch("self", "UPDATE_CURRENT_COLUMN", colInd);

    const newCenterColumn = appColumnWrappers.item(colInd);
    // Test: Let's...
    newCenterColumn.scrollIntoView();

    return state;
  },
}



const scrollEndPromise = new LazyDelayedPromiseOnceRest(100);



export const MainPage = (props) => {
  const [{
    colKeyArr,
    specStore,
    nonce,
    currInd,
    scrollLeft, scrollVelocity

  }, dispatch, passData] = useStateAndReducers({
    colKeyArr: [0, 1],
    specStore: {"0": {entID: HOME_ENTITY_ID}, "1": {entID: 1}},
    nonce: 1,
    currInd: 0,
    scrollLeft: 0, scrollVelocity: 0,

  }, props, mainPageReducers);


  // const location = useLocation();
  // const pathname = location.pathname;
  // const search = location.search;


  const appColumns = colKeyArr.map((colKey, ind) => {
    let colSpec = specStore[colKey];
    return (
      <div id={"app-column-wrapper-" + colKey}>
        <AppColumn key={colKey} colKey={colKey} colSpec={colSpec} />
      </div>
    );
  });

  return passData(
    <div className="main-page">
      <InterfaceHeader
        setAppPage={void(0)}
        colKeyArr={colKeyArr} specStore={specStore} currInd={currInd}
      />
      <div className="column-container" onScroll={(event => {
        let {scrollLeft, scrollRight} = event.target;
        dispatch("self", "UPDATE_SCROLL", scrollLeft);
        // TODO: Also at some point add click event rather than using the
        // scroll snap property, since it is unresponsive for too long after
        // snapping. (But do this only when it can be tested that it doesn't
        // interfere with using arrow keys in e.g. text fields.)
      })}>
        <div className="margin"></div>
        {appColumns}
        <div className="margin"></div>
      </div>
    </div>
  );
};

export function getColumnSpec(pathname) {
  let entID = (
    pathname.match(/\/e[1-9][0-9]/)[0] ?? "/e" + HOME_ENTITY_ID
  ).substring(2);
  return {entID: entID};
}

export function getCallerColumnKey(search) {

}


export const InterfaceMain = () => {
  // const [columns, columnListManager] = useContext(ColumnListContext);
  const columns = {};

  let fst = columns.fst;
  const appColumns = columns.keys.map((val, ind) => 
    <div key={val.id}
      style={{display: fst <= ind && ind < fst + columns.num ? null : "none"}}
    >
      <AppColumn colKey={val} />
    </div>
  );
  return (
    <div className="interface-main">
      <div className="interface-margin" onClick={() => {
        // columnListManager.cycleLeft();
      }}>
        <br/><span>&#10094;</span><br/>
      </div>
      <div className="column-container"
        style={{gridTemplateColumns: "1fr ".repeat(columns.num)}}
      >
        {appColumns}
      </div>
      <div className="interface-margin" onClick={() => {
        // columnListManager.cycleRight();
      }}>
        <br/><span>&#10095;</span><br/>
      </div>
    </div>
  );
};
