import {useState, useEffect, useMemo, useContext} from "react";
// import {AccountManagerContext} from "./contexts/AccountContext.js";
import {useQuery} from "./DBRequests.js";
import {ColumnContext} from "./contexts/ColumnContext.js";

import {GeneralEntityElement} from "./EntityElements.js";
import {ListGeneratorSmallMenu} from "./ListGenPages.js";



/* Placeholders */
const UpdateButton = () => <template></template>;


 

export const EntListDisplay = ({
  listGenerator, ElemComponent, extraProps
}) => {
  ElemComponent ??= GeneralEntityElement;
  // const [lg, setLG] = useState(listGenerator);
  const [nonce, setNonce] = useState(0); // Used to force re-render.
  const update = () => {
    setNonce(nonce + 1);
  };
  const [entList, setEntList] = useState(null);

  useEffect(() => {
    listGenerator.generateEntList(combList => {
      setEntList(combList);
    });
  }, [listGenerator, nonce]);


  return (
    <div className="ent-list-display">
      <EntListHeader lg={listGenerator} update={update}
        // startAsExpanded={headerIsExpanded}
      />
      <EntListContainer
        entList={entList} lg={listGenerator} update={update}
        ElemComponent={ElemComponent} extraProps={extraProps}
      />
    </div>
  );
};



export const EntListHeader = ({lg, update}) => {
  return (
    <div className="ent-list-header">
      <span>
        <UpdateButton update={update} />
        <ListGeneratorSmallMenu lg={lg} />
      </span>
    </div>
  );
};








// For now, we will just let EntListContainer render all elements at once,
// but a TODO is to turn it into an infinite scroller, or make an 'append
// more elements' button at the end. And in a future implementation, this
// might also trigger a call to lg.requestMoreElements(), until this method
// returns false.


export const EntListContainer = ({
  entList, lg, update, ElemComponent, extraProps
}) => {
  if (!entList) {
    return (
      <div className="ent-list-container">
      </div>
    );
  }

  const children = entList.map((val) => (
    <ElemComponent key={val[1]}
      entID={val[1]} combScore={val[0]} listGenerator={lg}
      {...extraProps}
    />
  ));

  return (
    <div className="ent-list-container">
      {children}
    </div>
  );
};
