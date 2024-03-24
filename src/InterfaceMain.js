import {useState, createContext, useContext, useMemo} from "react";
import {ColumnListContext, ColumnContextProvider}
  from "./contexts/ColumnContext.js";

import {EntityPage} from "./EntityPages.js";
import {ListGeneratorPage} from "./ListGenPages.js";

/* Placeholders */
// const ListGeneratorPage = () => <template></template>;


export const InterfaceMain = () => {
  const [columns, columnListManager] = useContext(ColumnListContext);

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
        columnListManager.cycleLeft();
      }}>
        <br/><span>&#10094;</span><br/>
      </div>
      <div className="column-container"
        style={{gridTemplateColumns: "1fr ".repeat(columns.num)}}
      >
        {appColumns}
      </div>
      <div className="interface-margin" onClick={() => {
        columnListManager.cycleRight();
      }}>
        <br/><span>&#10095;</span><br/>
      </div>
    </div>
  );
};







const AppColumn = ({colKey}) => {
  const colSpec = colKey.colSpec;

  var page;
  if (colSpec.entID) {
    page = <EntityPage entID={colSpec.entID} />;
  }
  if (colSpec.lg) {
    page = <ListGeneratorPage lg={colSpec.lg} />;
  }

  return (
    <div className="app-column">
      <ColumnButtonContainer colKey={colKey} />
      <ColumnContextProvider colKey={colKey}>
        {page}
      </ColumnContextProvider>
    </div>
  );
};



const ColumnButtonContainer = ({colKey}) => {
  return (
    <div>
      {/* <PinButton /> */}
      <CloseColumnButton colKey={colKey} />
    </div>
  );
};
const CloseColumnButton = ({colKey}) => {
  // (Using ColumnListContext rather than ColumnContext because a future
  // implementation might include buttons for columns to switch places with
  // neighbors.)
  const [, columnListManager] = useContext(ColumnListContext);

  return (
    <button type="button" className="close" onClick={() => {
      columnListManager.closeColumn(colKey);
    }}>
      <span>&times;</span>
    </button>
  );
};
