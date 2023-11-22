import {useState, useEffect, useMemo, useContext} from "react";
import {AccountManagerContext} from "./contexts/AccountContext.js";
import {useQuery} from "./DBRequests.js";



/* Placeholders */
// const EntListDisplayHeader = () => <template></template>;


// For now, we will just let EntListContainer render all elements at once,
// but a TODO in the near future is to turn it into an infinite scroller.

export const EntListContainer = ({structure, ElemComponent}) => {
  const set = (structure ?? {}).set;

  if (!set) {
    return (
      <div className="set-container">
      </div>
    );
  }

  const children = set.map((val) => (
    <ElemComponent key={val[1]}
      entID={val[1]} combScore={val[0]} structure={structure}
    />
  ));

  return (
    <div className="set-container">
      {children}
    </div>
  );
};
