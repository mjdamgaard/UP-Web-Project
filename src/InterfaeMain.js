import {useState, createContext, useContext} from "react";

import {ColumnsContext} from "/src/contexts/ColumnsContext.js";


const InterfaceMain = () => {
  const [columns, columnManager] = useContext(ColumnsContext);

  let fst = columns.fst;
  const appColumns = columns.keys.map((val, ind) => 
    <AppColumn key={val}
      style={(fst <= ind && ind < fst + columns.num) ? {} : {display: "none"}}
    />
  );
  return (
    <div>
      <div class="left-margin" onClick={columnManager.cycleLeft}>
        <br/><span>&#10094;</span><br/>
      </div>
      <div class="column-container">
        {appColumns}
      </div>
      <div class="right-margin" onClick={columnManager.cycleRight}>
        <br/><span>&#10095;</span><br/>
      </div>
    </div>
  );
};







const AppColumn = ({key}) => {
  return (
    <div>
      <ColumnButtonContainer colKey={key} />
      <EntityPage />
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
  const [, columnManager] = useContext(ColumnsContext);

  return (
    <div>
      {/* <PinButton /> */}
      <CloseButton colKey={colKey} />
    </div>
  );
};
const CloseButton = ({colKey}) => {
  return (
    <button type="button" class="close"onClick={() => {
      columnManager.closeColumn(colKey);
    }}>
      <span>&times;</span>
    </button>
  );
};
