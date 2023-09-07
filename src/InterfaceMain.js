import {useState, createContext, useContext} from "react";

import {ColumnsContext} from "./contexts/ColumnsContext.js";


export const InterfaceMain = () => {
  const [columns, columnManager] = useContext(ColumnsContext);

  let fst = columns.fst;
  const appColumns = columns.keys.map((val, ind) => 
    <div style={{
      display: fst <= ind && ind < fst + columns.num ? "block" : "none"
    }}>
      <AppColumn key={val} colKey={val} />
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
  return (
    <div className="app-column">
      <ColumnButtonContainer colKey={colKey} />
      {/* <EntityPage /> */}
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
      <CloseButton colKey={colKey} />
    </div>
  );
};
const CloseButton = ({colKey}) => {
  const [, columnManager] = useContext(ColumnsContext);

  return (
    <button type="button" className="close" onClick={() => {
      columnManager.closeColumn(colKey);
    }}>
      <span>&times;</span>
    </button>
  );
};
