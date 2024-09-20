import {
  useState, createContext, useContext, useMemo, useId, useEffect,
  useLayoutEffect
} from "react";
import {
  useStateAndReducers, useDispatch
} from "../../contexts_and_hooks/useStateAndReducers.js"

import {
  useLocation, Navigate,
} from "react-router-dom";


import {InterfaceHeader} from "../InterfaceHeader.js";
import {AppColumn} from "../app_columns/AppColumn.js";
import {ListGeneratorPage} from "../ListGenPages.js";


/* Placeholders */
// const ListGeneratorPage = () => <template></template>;


export const HOME_ENTITY_ID = 12;


const PX_TO_SCROLL_BEFORE_CHANGING_COLUMN = 80;
const PX_TO_CENTER_BEFORE_CHANGING_CURR_IND_ON_SCROLL = 200;
const TIME_BEFORE_ALWAYS_GOING_TO_CLOSEST_COLUMN = 200;



const mainPageReducers = {
  key: "main",
  "OPEN_COLUMN": function ([state], [colSpec, callerColKey]) {
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

  "UPDATE_SCROLL": function ([state], scrollLeft) {
    return {
      ...state,
      scrollLeft: scrollLeft,
      scrollVelocity: scrollLeft - state.scrollLeft,
      lastScrollAt: Date.now(),
    };
  },

  getColumnContainerAndPositions: function () {
    const columnContainer = document.querySelector(
      COLUMN_LIST_CONTAINER_SELECTOR
    );

    const {left, right} = columnContainer.getBoundingClientRect();
    const pos = {left: left, center: (right - left) / 2, right: right};

    // Get the center position of the column container.
    const appColumnWrappers = columnContainer.querySelectorAll(
      COLUMN_POSTERIOR_SELECTOR
    );
    const childPosArr = [];
    appColumnWrappers.forEach((element, ind) => {
      let {left, right} = element.getBoundingClientRect();
      childPosArr[ind] = {
        left: left, center: left + (right - left) / 2, right: right
      };
    });

    return [columnContainer, pos, childPosArr];
  },

  "REACT_TO_SCROLL": function ([state], input, dispatch) {
    // Get the column container and the positions.
    const [, pos, childPosArr] = this.getColumnContainerAndPositions();
    // And get the center position of the column container.
    const center = pos.center;

    // If center of the currInd column is to close to the center, do nothing
    // except scrolling back to that column. 
    const centerDiff = childPosArr[state.currInd].center - center;
    if (Math.abs(centerDiff) < PX_TO_SCROLL_BEFORE_CHANGING_COLUMN) {
      return this["SCROLL_INTO_VIEW"]([state], newInd);
    }

    // Get the closest distance to a non-current column's center.
    var {absOffSet, closestInd} = childPosArr
      .filter((val, ind) => ind !== state.currInd)
      .reduce(
        (acc, val, ind) => {
          let offSetFromCenter = val.center - center;
          let absOffSet = Math.abs(offSetFromCenter);
          if (ind === 0) {
            return {absOffSet: absOffSet, closestInd: 0}
          }
          else if (absOffSet < acc.absOffSet) {
            return {absOffSet: absOffSet, closestInd: ind};
          }
          else {
            return acc;
          }
        },
        {}
      );
    // If this distance is below a threshold, or if it has been long enough
    // time since the last scroll, make that column the current one, also
    // automatically scrolling it into view.
    if (
      absOffSet < PX_TO_CENTER_BEFORE_CHANGING_CURR_IND_ON_SCROLL ||
      (Date.now() - state.lastScrollAt) >
        TIME_BEFORE_ALWAYS_GOING_TO_CLOSEST_COLUMN
    ) {
      return this["UPDATE_CURR_IND"]([state], closestInd);
    }

    // Else get the index of to the first column in the scroll direction from
    // the center of the column container.
    const scrollVelocity = state.scrollVelocity;
    const {newInd} = childPosArr.reduce(
      (acc, val, ind) => {
        let offSetFromCenter = val.center - center;
        let absOffSet = Math.abs(offSetFromCenter);
        if (ind === 0) {
          return {absOffSet: absOffSet, newInd: 0}
        }
        else if (Math.sign(offSetFromCenter) !== Math.sign(scrollVelocity)) {
          return acc;
        }
        else if (absOffSet < acc.absOffSet) {
          return {absOffSet: absOffSet, newInd: ind};
        }
        else {
          return acc;
        }
      },
      {}
    );
    // Then update the current column index, which also scrolls it into view,
    // automatically.
    return this["UPDATE_CURR_IND"]([state], newInd);
  },

  "SCROLL_INTO_VIEW": function ([state], colInd) {
    // Get the column container and the positions.
    const [columnContainer, pos, childPosArr] =
      this.getColumnContainerAndPositions();
    // And get the center position of the column container.
    const center = pos.center;

    // Get the amount to scroll to the new column.
    const centerDiff = childPosArr[colInd].center - center;
    
    // Now scroll by that amount.
    columnContainer.scrollBy({left: centerDiff, behavior: "smooth"});

    return;
  },

  "UPDATE_CURR_IND": function ([state], newInd) {
    this["SCROLL_INTO_VIEW"]([state], newInd);

    return {...state, currInd: newInd};
  },
}


const COLUMN_LIST_CONTAINER_SELECTOR = ".column-container";
const COLUMN_POSTERIOR_SELECTOR = ".app-column-wrapper";


export const MainPage = (props) => {
  const [{
    colKeyArr,
    specStore,
    nonce,
    currInd,
    // scrollLeft, scrollVelocity, lastScrollAt,

  }, dispatch, passData] = useStateAndReducers({
    colKeyArr: [0, 1],
    specStore: {"0": {entID: HOME_ENTITY_ID}, "1": {entID: 1}},
    nonce: 1,
    currInd: 0,
    // scrollLeft: 0, scrollVelocity: 0, lastScrollAt: 0,

  }, props, mainPageReducers);

  useLayoutEffect(() => {
    let currColSpec = specStore[colKeyArr[currInd]];
    let newPath = currColSpec.entID ? "e" + currColSpec.entID : "";
    window.history.pushState(null, "", newPath);
    // TODO: Refactor:
    mainPageReducers["SCROLL_INTO_VIEW"]([], currInd);
    window.onresize = (event) => {
      mainPageReducers["SCROLL_INTO_VIEW"]([], currInd);
    };
  }, [currInd])



  const appColumns = colKeyArr.map((colKey, ind) => {
    let colSpec = specStore[colKey];
    return (
      <div key={colKey} className={
        "app-column-wrapper" + ((currInd === ind) ? " active" : "")
      }
        onClick={
          (currInd === ind) ? null : () => {
            dispatch("self", "UPDATE_CURR_IND", ind);
          }
        }
      >
        <AppColumn colKey={colKey} colSpec={colSpec} />
      </div>
    );
  });

  return passData(
    <div className="main-page">
      <InterfaceHeader
        setAppPage={void(0)}
        colKeyArr={colKeyArr} specStore={specStore} currInd={currInd}
      />
      <div className="column-container"
      // onresize={event => {debugger;
      //   mainPageReducers["SCROLL_INTO_VIEW"]([], currInd);
      // }}
      // onScroll={(event => {
      //   let {scrollLeft} = event.target;
      //   dispatch("self", "UPDATE_SCROLL", scrollLeft);
      //   // TODO: Also at some point add click event rather than using the
      //   // scroll snap property, since it is unresponsive for too long after
      //   // snapping. (But do this only when it can be tested that it doesn't
      //   // interfere with using arrow keys in e.g. text fields.)
      // })}
      // onMouseUp={event => {
      //   dispatch("self", "REACT_TO_SCROLL");
      // }}
      >
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
