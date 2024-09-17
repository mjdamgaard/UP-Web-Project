import {useState, createContext, useContext, useMemo, useId} from "react";
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

const mainPageReducers = {
  key: "main",
  "OPEN_COLUMN": ([state], [colSpec, callerColKey]) => {
    const {colKeyArr, specStore, fst, n, nonce} = state;
    let callerColInd = colKeyArr.indexOf(callerColKey);
    let newNonce = nonce + 1;
    let newColKeyArr = (callerColInd === -1) ?
      colKeyArr.concat([newNonce]) :
      colKeyArr.slice(0, callerColInd + 1).concat(
        [newNonce], colKeyArr.slice(callerColInd + 1)
      )
    let newSpecStore = {...specStore, [newNonce]: colSpec};
    let newCurrInd = callerColInd + 1;
    let newFST = (fst < newCurrInd - n + 1) ?
      newCurrInd - n + 1 :
      (fst > newCurrInd) ?
        newCurrInd :
        fst;
    return {
      colKeyArr: newColKeyArr,
      specStore: newSpecStore,
      nonce: newNonce, currInd: newCurrInd, fst: newFST, n: n,
    };
  },
}

export const MainPage = (props) => {
  const [{
    colKeyArr,
    specStore,
    nonce, currInd, fst, n,

  }, dispatch, passData] = useStateAndReducers({
    colKeyArr: [0, 1],
    specStore: {"0": {entID: HOME_ENTITY_ID}, "1": {entID: HOME_ENTITY_ID}},
    nonce: 1, currInd: 0, fst: 0, n: 1,

  }, props, mainPageReducers);


  // const location = useLocation();
  // const pathname = location.pathname;
  // const search = location.search;


  const appColumns = colKeyArr.map((colKey, ind) => {
    let colSpec = specStore[colKey];
    return (
      <AppColumn key={colKey} colKey={colKey} colSpec={colSpec} />
    );
  });

  return passData(
    <div className="main-page">
      <InterfaceHeader
        setAppPage={void(0)}
        colKeyArr={colKeyArr} specStore={specStore} currInd={currInd} n={n}
      />
      <div className="column-container" onScroll={(event => {
        // TODO: Implement function that sets the by calling a
        // dispatch("self", "FOCUS") reducer to do so.
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
