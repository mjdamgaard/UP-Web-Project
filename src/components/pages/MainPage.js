import {useState, createContext, useContext, useMemo, useId} from "react";
import {
  useLocation,
} from "react-router-dom";

import {AppColumn} from "../app_columns/AppColumn.js";
import {ListGeneratorPage} from "../ListGenPages.js";

/* Placeholders */
// const ListGeneratorPage = () => <template></template>;


export const HOME_ENTITY_ID = 12;


export const MainPage = ({}) => {
  const location = useLocation();
  const pathname = location.pathname;
  // const search = location.search;

  console.log(useId());

  var entID = HOME_ENTITY_ID;
  if (pathname) {
    entID = (pathname.match(/^\/e[1-9][0-9]*/)[0] ?? "/e" + entID).substring(2);
  }

  const [[colSpecs, colIndexes], setColState] = useState([
    [{entID: entID}], {[location.key]: 0}
  ]);

  const currColInd = colIndexes[location.key];
  const currColSpec = colSpecs[currColInd];
  const action = window.history.action;


  return (
    <AppColumn colKey={{colSpec: {entID: entID}}} />
  );
};


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
