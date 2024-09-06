import {useState, createContext, useContext, useMemo, useId} from "react";
import {useHistoryState} from "../../contexts_and_hooks/HistoryStateContext.js";
import {
  useLocation, Navigate,
} from "react-router-dom";

import {AppColumn} from "../app_columns/AppColumn.js";
import {ListGeneratorPage} from "../ListGenPages.js";

/* Placeholders */
// const ListGeneratorPage = () => <template></template>;


export const HOME_ENTITY_ID = 12;


export const MainPage = ({}) => {
  const [[ colKeyArr, specStore, currInd, fst, n, nonce ], setColumListData] =
    useHistoryState([ [0], {"0": {entID: HOME_ENTITY_ID}}, 0, 0, 1, 1 ]);

  const location = useLocation();
  const pathname = location.pathname;
  const search = location.search;

  var navigate = <></>;
  if (/^\?from=/.test(search)) {
    let newColSpec = getColumnSpec(pathname);
    let callerColKey = getCallerColumnKey(search);
    let callerColInd = colKeyArr.indexOf(callerColKey);

    let newNonce = nonce + 1;
    let newColKeyArr = (callerColInd === -1) ?
      colKeyArr.concat([newNonce]) :
      colKeyArr.slice(0, callerColInd + 1).concat(
        [newNonce], colKeyArr.slice(callerColInd + 1)
      )
    let newSpecStore = {...specStore, [newNonce]: newColSpec};
    let newCurrInd = callerColInd + 1;
    let newFST = (fst < newCurrInd - n + 1) ?
      newCurrInd - n + 1 :
      (fst > newCurrInd) ?
        newCurrInd :
        fst;
    
    setColumListData(
      [newColKeyArr, newSpecStore, newCurrInd, newFST, n, newNonce]
    );
    navigate = <Navigate replace to={{pathname}} />
  }

  const appColumns = colKeyArr.map(colKey => {
    let colSpec = specStore[colKey];
    return <AppColumn key={colKey} colKey={colKey} colSpec={colSpec} />
  });

  return (
    <div className="main-page">
      {appColumns}
      {navigate}
    </div>
  );
};

export function getColumnSpec(pathname) {
  let entID = (pathname.match(/e[1-9][0-9]/) ?? "e" + HOME_ENTITY_ID).substring(1);
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
