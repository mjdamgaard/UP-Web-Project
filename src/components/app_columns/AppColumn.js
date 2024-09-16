import {useState, createContext, useContext, useMemo} from "react";
import {
  useStateAndReducers, useDispatch
} from "../../contexts_and_hooks/useStateAndReducers.js"
import React from 'react';
import {ColumnContext} from "../../contexts_and_hooks/ColumnContext.js";

import {EntityPage} from "../EntityPage.js";
import {ListGeneratorPage} from "../ListGenPages.js";

/* Placeholders */
// const ListGeneratorPage = () => <template></template>;



const mainPageReducers = {
  key: "app-column",
  "OPEN_COLUMN": ([state, props], colSpec, dispatch) => {
    let callerColKey = props.colKey;
    dispatch("main", "OPEN_COLUMN", [colSpec, callerColKey]);
  },
}


export const AppColumn = (props) => {
  const {colKey, colSpec} = props;
  const [dispatch, passData] = useDispatch(props, mainPageReducers);

  var page;
  if (colSpec.entID) {
    page = <EntityPage entID={colSpec.entID} />;
  }
  if (colSpec.lg) {
    page = <ListGeneratorPage lg={colSpec.lg} />;
  }

  return passData(
    <div className="app-column">
      <ColumnButtonContainer colKey={colKey} />
      <ColumnContext.Provider value={colKey}>
        {page}
      </ColumnContext.Provider>
    </div>
  );
};

class ColumnButtonContainer extends React.Component {
  render() {
    return (
      <div>
        {/* <PinButton /> */}
        <CloseColumnButton colKey={this.props.colKey} />
      </div>
    );
  }
}
// const ColumnButtonContainer = ({colKey}) => {
//   return (
//     <div>
//       {/* <PinButton /> */}
//       <CloseColumnButton colKey={colKey} />
//     </div>
//   );
// };
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
