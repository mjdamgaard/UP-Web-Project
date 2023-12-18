import {useState, useEffect, useMemo, useContext} from "react";
import {AccountManagerContext} from "./contexts/AccountContext.js";
import {useQuery} from "./DBRequests.js";



/* Placeholders */
// const EntListDisplayHeader = () => <template></template>;


// For now, we will just let EntListContainer render all elements at once,
// but a TODO in the near future is to turn it into an infinite scroller.


export const EntListContainer = ({
  entList, ElemComponent, listGenerator, update
}) => {
  if (!entList) {
    return (
      <div className="ent-list-container">
      </div>
    );
  }

  const children = entList.map((val) => (
    <ElemComponent key={val[1]}
      entID={val[1]} combScore={val[0]} listGenerator={listGenerator}
    />
  ));

  return (
    <div className="ent-list-container">
      {children}
    </div>
  );
};
