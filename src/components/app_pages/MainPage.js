import {
  useState, createContext, useContext, useMemo, useId, useEffect,
  useLayoutEffect
} from "react";
import {useDispatch} from "../../contexts_and_hooks/useDispatch.js"

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
  "OPEN_COLUMN": function ({state}, [colSpec, callerColKey]) {
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

  "SCROLL_INTO_VIEW": function ({state}, colInd) {
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

  "UPDATE_CURR_IND": function ({state: state}, newInd) {
    this["SCROLL_INTO_VIEW"]({state: state}, newInd);

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

  }, setState] = useState({
    colKeyArr: [0, 1],
    specStore: {"0": {entID: HOME_ENTITY_ID}, "1": {entID: 1}},
    nonce: 1,
    currInd: 0,
    // scrollLeft: 0, scrollVelocity: 0, lastScrollAt: 0,

  });

  const [refCallback, dispatch] = useDispatch(
    mainPageReducers, "main", setState, props
  );

  useLayoutEffect(() => {
    let currColSpec = specStore[colKeyArr[currInd]];
    let newPath = currColSpec.entID ? "e" + currColSpec.entID : "";
    window.history.pushState(null, "", newPath);
    // TODO: Refactor:
    mainPageReducers["SCROLL_INTO_VIEW"]({}, currInd);
    window.onresize = (event) => {
      mainPageReducers["SCROLL_INTO_VIEW"]({}, currInd);
    };
  }, [currInd])



  const appColumns = colKeyArr.map((colKey, ind) => {
    let colSpec = specStore[colKey];
    return (
      <div key={colKey} className={
        "app-column-wrapper" + ((currInd === ind) ? " active" : "")
      }
        onClick={(e) => {
          if (currInd === ind) {
            mainPageReducers["SCROLL_INTO_VIEW"]({}, ind);
          } else {
            dispatch(e.target, "self", "UPDATE_CURR_IND", ind);
          }
        }}
      >
        <AppColumn colKey={colKey} colSpec={colSpec} />
      </div>
    );
  });

  return (
    <div className="main-page" ref={refCallback}>
      <InterfaceHeader
        setAppPage={void(0)}
        colKeyArr={colKeyArr} specStore={specStore} currInd={currInd}
      />
      <div className="column-container">
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
