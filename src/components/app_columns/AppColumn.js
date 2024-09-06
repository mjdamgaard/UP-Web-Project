import {useState, createContext, useContext, useMemo, useId} from "react";
import {ColumnContext} from "../../contexts_and_hooks/ColumnContext.js";

import {EntityPage} from "../EntityPage.js";
import {ListGeneratorPage} from "../ListGenPages.js";

/* Placeholders */
// const ListGeneratorPage = () => <template></template>;



export const AppColumn = ({colKey}) => {
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
      <ColumnContext.Provider value={colKey}>
        {page}
      </ColumnContext.Provider>
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
  // const [, columnListManager] = useContext(ColumnListContext);

  return (
    <button type="button" className="close" onClick={() => {
      // columnListManager.closeColumn(colKey);
    }}>
      <span>&times;</span>
    </button>
  );
};
