import {useState, useEffect, useMemo, useContext} from "react";
// import {AccountManagerContext} from "./contexts/AccountContext.js";
import {useQuery} from "../contexts_and_hooks/DBRequests.js";
import {ColumnContext} from "../contexts_and_hooks/ColumnContext.js";

import {GeneralEntityElement} from "./EntityElements.js";
import {ListGeneratorSmallMenu} from "./ListGenPages.js";



/* Placeholders */
const UpdateButton = () => <template></template>;


 

export const InstListDisplay = ({
  listGenerator, ElemComponent, extraProps
}) => {
  ElemComponent ??= GeneralEntityElement;
  // const [lg, setLG] = useState(listGenerator);
  const [nonce, setNonce] = useState(0); // Used to force re-render.
  const update = () => {
    setNonce(nonce + 1);
  };
  const [instList, setInstList] = useState(null);

  useEffect(() => {
    listGenerator.generateInstList(combList => {
      setInstList(combList);
    });
  }, [listGenerator, nonce]);


  return (
    <div className="ent-list-display">
      <InstListHeader lg={listGenerator} update={update}
        // startAsExpanded={headerIsExpanded}
      />
      <InstListContainer
        instList={instList} lg={listGenerator} update={update}
        ElemComponent={ElemComponent} extraProps={extraProps}
      />
    </div>
  );
};



export const InstListHeader = ({lg, update}) => {
  return (
    <div className="ent-list-header">
      <span>
        <UpdateButton update={update} />
        <ListGeneratorSmallMenu lg={lg} />
      </span>
    </div>
  );
};








// For now, we will just let InstListContainer render all elements at once,
// but a TODO is to turn it into an infinite scroller, or make an 'append
// more elements' button at the end. And in a future implementation, this
// might also trigger a call to lg.requestMoreElements(), until this method
// returns false.


export const InstListContainer = ({
  instList, lg, update, ElemComponent, extraProps
}) => {
  if (!instList) {
    return (
      <div className="ent-list-container">
      </div>
    );
  }

  const children = instList.map((val) => (
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
