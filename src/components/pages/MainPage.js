import {useState, createContext, useContext, useMemo, useId} from "react";

import {
  useLocation, Navigate,
} from "react-router-dom";

import {AppColumn} from "../app_columns/AppColumn.js";
import {ListGeneratorPage} from "../ListGenPages.js";

/* Placeholders */
// const ListGeneratorPage = () => <template></template>;


export const HOME_ENTITY_ID = 12;


export const MainPage = ({}) => {
  const [
    [
      colKeyArr,
      specStore,
      currInd, fst, n, nonce,
      isOpening, // TODO: Remove.
    ],
    setColListData
  ] = useState(
    [
      [0, 2],
      {"0": {entID: HOME_ENTITY_ID}, "2": {entID: HOME_ENTITY_ID}},
      0, 0, 1, 1,
      false,
    ]
  );

  console.log((() => {
    let ret = <AppColumn key="temp key" />;
    ret = {...ret, key: "hello key!"};
    return ret;
  })()); // Works.

  // console.log((() => {
  //   let ret = <><AppColumn /></>;
  //   ret = {...ret, key: "hello key!"};
  //   return ret;
  // })());  // Also works.

  // console.log((() => {
  //   let ret = <><AppColumn /><div></div></>;
  //   ret = {...ret, key: "hello key!"};
  //   return ret;
  // })());  // Also works.


  // const [[
  //   callerColInd, colSpec
  // ], setNewColData] = useSessionState([
  //   null, null
  // ]);
  const [callerColInd, colSpec, setNewColData] = [null, null, void(0)]

  const location = useLocation();
  const pathname = location.pathname;
  const search = location.search;

  if (colSpec && !isOpening) {
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
    
    setColListData([
      newColKeyArr,
      newSpecStore,
      newCurrInd, newFST, n, newNonce,
      true,
    ]);
  }
  else if (colSpec && isOpening) {
    setNewColData([null, null]);
  }
  else if (!colSpec && isOpening) {
    setColListData(prev => {
      let ret = {...prev};
      ret[6] = false; // isOpening = false;
      return ret;
    });
  }

  const appColumns = colKeyArr.map((colKey, ind) => {
    let colSpec = specStore[colKey];
    let ret = (
      <div key={colKey} className={
        (ind == currInd) ? "in-focus" : (ind == fst) ? "fst-column" : ""
      }>
        <AppColumn key={colKey} colKey={colKey} colSpec={colSpec} />
      </div>
    );
    // return (
    //   <div key={colKey} className={
    //     (ind == currInd) ? "in-focus" : (ind == fst) ? "fst-column" : ""
    //   }>
    //     <AppColumn colKey={colKey} colSpec={colSpec} />
    //   </div>
    // );
    let ret2 = {...ret};
    ret2.key = colKey;
    return ret2;
  });

  return (
    <div className="main-page">
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
