import {useState, createContext, useContext} from "react";

import {ColumnListContext, ColumnContext} from "./contexts/ColumnContext.js";

export const InterfaceMain = () => {
  const [columns, columnManager] = useContext(ColumnListContext);

  let fst = columns.fst;
  const appColumns = columns.keys.map((val, ind) => 
    <div key={val}
      style={{display: fst <= ind && ind < fst + columns.num ? null : "none"}}
  >
      <AppColumn colKey={val} />
    </div>
  );
  return (
    <div className="interface-main">
      <div className="interface-margin" onClick={columnManager.cycleLeft}>
        <br/><span>&#10094;</span><br/>
      </div>
      <div className="column-container">
        {appColumns}
      </div>
      <div className="interface-margin" onClick={columnManager.cycleRight}>
        <br/><span>&#10095;</span><br/>
      </div>
    </div>
  );
};







const AppColumn = ({colKey}) => {
  const columnEntID = JSON.parse(colKey).entID;
  return (
    <div className="app-column">
      <ColumnButtonContainer colKey={colKey} />
      <ColumnContext.Provider value={columnEntID}>
        <EntityPage entID={entID} />
      </ColumnContext.Provider>
    </div>
  );
};
// appColumnCL.addCallback("data", function(data) {
//   data.copyFromAncestor("cl", 1);
//   data.cl ??= appColumnCL.getRelatedCL("EntityPage");;
//   data.recLevel = null;
//   data.maxRecLevel = null;
// });



const ColumnButtonContainer = ({colKey}) => {
  return (
    <div>
      {/* <PinButton /> */}
      <CloseColumnButton colKey={colKey} />
    </div>
  );
};
const CloseColumnButton = ({colKey}) => {
  const [, columnManager] = useContext(ColumnListContext);

  return (
    <button type="button" className="close" onClick={() => {
      columnManager.closeColumn(colKey);
    }}>
      <span>&times;</span>
    </button>
  );
};
