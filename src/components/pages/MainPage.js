import {useState, createContext, useContext, useMemo, useId} from "react";
import {
  useSessionState, useSessionStateless
} from "../../contexts_and_hooks/useSessionState.js";

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
      currInd: newCurrInd, fst: newFST, n: n, nonce: newNonce,
    };
  },
}

export const MainPage = (props) => {
  const [{
    colKeyArr,
    specStore,
    currInd, fst, n, nonce,

  }, passKeys, dispatch] = useSessionState({
    colKeyArr: [0, 2],
    specStore: {"0": {entID: HOME_ENTITY_ID}, "2": {entID: HOME_ENTITY_ID}},
    currInd: 0, fst: 0, n: 1, nonce: 1,

  }, props, mainPageReducers);


  // const location = useLocation();
  // const pathname = location.pathname;
  // const search = location.search;


  const appColumns = colKeyArr.map((colKey, ind) => {
    let colSpec = specStore[colKey];
    return (
      <div key={colKey} className={
        (ind == currInd) ? "in-focus" : (ind == fst) ? "fst-column" : ""
      }>
        <AppColumn key={colKey} colKey={colKey} colSpec={colSpec} />
      </div>
    );
  });

  return passKeys(
    <div className="main-page">
      <InterfaceHeader
        setAppPage={void(0)}
        colKeyArr={colKeyArr} specStore={specStore} currInd={currInd} n={n}
      />
      {appColumns}
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
