import {useState, useEffect, useMemo, useContext} from "react";
import {AccountManagerContext} from "./contexts/AccountContext.js";
import {useQuery} from "./DBRequests.js";



/* Placeholders */
const InstanceSetDisplayHeader = () => <template></template>;


// For now, we will just let InstanceSetContainer render all elements at once,
// but a TODO in the near future is to turn it into an infinite scroller.

export const InstanceSetContainer = ({set, setStructure, ElemComponent}) => {
  if (!set) {
    return (
      <div className="set-container">
      </div>
    );
  }

  const children = set.map((val, ind) => (
    <ElemComponent key={val[1]} />
  ));

  return (
    <div className="set-container">
      {children}
    </div>
  );
};
