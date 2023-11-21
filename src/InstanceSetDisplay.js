import {useState, useEffect, useMemo, useContext, createContext} from "react";
import {AccountManagerContext} from "./contexts/AccountContext.js";
import {useQuery} from "./DBRequests.js";

import {InstanceSetHeader} from "./InstanceSetHeader.js";
import {InstanceSetContainer} from "./InstanceSetContainer.js";
import {GeneralEntityElement} from "./EntityElements.js";


/* Placeholders */
// const InstanceSetHeader = () => <template></template>;
// const InstanceSetContainer = () => <template></template>;

// export const StructureContext = createContext();


export const InstanceSetDisplay = ({
  initStructure, ElemComponent, initFilterOptions
}) => {
  ElemComponent ??= GeneralEntityElement;
  initFilterOptions ??= {};
  const [structure, setStructure] = useState({...initStructure});
  const [filterOptions, setFilterOptions] = useState({...initFilterOptions});
  const accountManager = useContext(AccountManagerContext);
  const [reqData, setReqData] = useState({});
  const [results, setResults] = useState({});

  // If reqData changes, fire off the relevant queries to the database.
  useQuery(results, setResults, reqData);

  // Look as results (query results), make new requests if necessary (by
  // updating reqData), and finally obtain the set of elements (recorded in
  // structure.set). 
  updateStructureAndRequests(
    structure, setStructure, results, setReqData, accountManager
  );

  // Before combined set is ready, render this:
  if (!structure.set) {
    return (
      <div className="set-display">
        {/* <StructureContext.Provider value={[structure, setStructure]} > */}
        <InstanceSetHeader
          structure={structure} setStructure={setStructure}
          filterOptions={filterOptions} setFilterOptions={setFilterOptions}
        />
        <InstanceSetContainer structure={null} ElemComponent={ElemComponent} />
        {/* </StructureContext.Provider> */}
      </div>
    );
  }

  // And when it is ready, render the full component:
  return (
    <div className="set-display">
      <InstanceSetHeader
        structure={structure} setStructure={setStructure}
        ElemComponent={ElemComponent}
        filterOptions={filterOptions} setFilterOptions={setFilterOptions}
      />
      <InstanceSetContainer
        structure={structure} setStructure={setStructure}
        ElemComponent={ElemComponent}
      />
    </div>
  );
};


// In this implementation, we will only query for each set once, namely by
// querying for the first 4000 (e.g.) elements at once and non other than
// that. We can therefore make these queries right away. The "structure" of
// the instance set then defines how these sets are combined and sorted.
// TODO: Reimplement at some point so that InstanceSetDisplay can query for
// more elements than the initial ones if the user requests it (e.g. by
// scrolling past enough elements).
// Oh, and in this implementation, we will only use the "simple" set
// structures as the leaves of the combined structure tree, which each takes
// one catID and queries that category with all users/bots in
// accountManager.queryUserPriorityArr, then selects the rating values of the
// first user/bot in that array if it exists, and if not, it selects that of
// the next user/bot in the array, and so on.

// Each node in the "structure" defining the instance set has at least a
// "type" property and a "set" property, which has a falsy value if the set
// is not yet ready. The nodes might also have a property "isFetching" for
// when the leaf sets are queried for but has not arrived, and a property
// "isFetched" for when they have arrived (but the "set" is not necessarily
// ready yet).
// The inner nodes of the structure tree also all have a "children" property.
// The various node types might also have other properties. For instance, the
// "simple" nodes will have either a catID or a "catSK" property.

function updateStructureAndRequests(
  structure, setStructure, results, setReqData, accountManager
) {
  // If the set is already ready, return true.
  if (structure.set) {
    return true;
  }debugger;

  // Else, see if the node is a combinator node (with a 'children' property),
  // and update its children recursively, if they are not ready yet.
  let children = structure.children;
  if (children) {
    let areReady = children.reduce(
      (acc, val) => acc && val.set,
      true
    );
    if (!areReady) {
      children.map((val, ind) => {
        let childSetStructure = y => {
          if (y instanceof Function) {
            return x => y(x[ind]);
          } else {
            return x => {
              x[ind] = y;
            };
          }
        }
        updateStructureAndRequests(
          val, childSetStructure, results, setReqData, accountManager
        );
      });
      return false;
    }
  }

  // Else, switch-case the node type and update the results and reqData when
  // possible. By using setReqData for the latter, it means that the queries
  // will be forwarded in the useQuery() call above, and when they return,
  // updateStructureAndRequests() will be called again to make further updates.
  switch (structure.type) {
    case "simple":
      let userIDArr = accountManager.queryUserPriorityArr;
      querySetsForAllUsersThenCombine(
        structure, setStructure, results, setReqData, userIDArr,
        combineByPriority
      )
      
      break;
    case "max-rating-comb":debugger;
        let setArr = children.map(val => val.set);
        structure.set = combineByMaxRating(setArr);
      break;
    default:
      throw "updateSetStructure(): unrecognized node type."
  }
  return false;
}



export function getCatKeys(structure) { 
  switch (structure.type) {
    case "some-exception":
      // Implement if this is ever needed.
      break;
    default:
      if (structure.catID || structure.catSK) {
        return [structure];
      }
      if (!structure.children) {
        throw (
          "getCatKeys(): Following node needs implementing: " +
          JSON.stringify(structure)
        )
      }
      // if (structure.children.length === 0) {
      //   return [];
      // }
      let childCatKeyArrays = structure.children.map(val => getCatKeys(val));
      return [].concat(...childCatKeyArrays);
  }
}





function querySetsForAllUsersThenCombine(
  structure, setStructure, results, setReqData, userIDArr,
  combineProcedure, optionalData
) {      
  // If the sets are already ready, combine them with the combineByPriority
  // procedure, then return true.
  if (structure.setArr) {
    setStructure(prev => {
      let ret = {...prev};
      ret.set = combineProcedure(structure.setArr, optionalData);
      return ret;
    });
    return true;
  }

  // Else if we already have the catID, start fetching the sets if they
  // have not already been fetched, or is in the process of being fetched.
  let catID = structure.catID;
  if (catID) {
    if (!structure.isFetching) {
      setStructure(prev => {
        let ret = {...prev};
        ret.isFetching = true;
        return ret;
      });
      userIDArr.forEach((userID) => {
        let data = {
          req: "set",
          u: userID,
          c: catID,
          rl: 0,
          rh: 0,
          n: 4000,
          o: 0,
          a: 0,
        };
        let key = JSON.stringify(["set", userID, catID]);
        setReqData(prev => {
          let ret = {...prev};
          ret[key] = data;
          return ret;
        });
      });
    } else {
      // If the sets have all arrived, set structure.setArr (which will
      // then finally be combined by combineProcedure()). Else do nothing
      // yet.
      let isFetched = userIDArr.reduce((acc, val) => {
        let key = JSON.stringify(["set", val, catID]);
        return acc && (results[key] ?? {}).isFetched;
      }, true);
      if (isFetched) {
        setStructure(prev => {
          let ret = {...prev};
          ret.setArr = userIDArr.map(val => {
            let key = JSON.stringify(["set", val, catID]);
            return results[key].data;
          });
          ret.isFetching = false;
          return ret;
        });
      }
    }

  // If we don't yet have catID to begin with, see if it is already being
  // fetched, or else fetch it.
  } else if (catID === undefined) {
    let catSK = structure.catSK;
    let key = JSON.stringify(catSK);
    if (!structure.isFetching) {
      setStructure(prev => {
        let ret = {...prev};
        ret.isFetching = true;
        return ret;
      });
      let data = {
        req: "entID",
        t: 2,
        c: catSK.cxtID,
        s: catSK.defStr,
      };
      setReqData(prev => {
        let ret = {...prev};
        ret[key] = data;
        return ret;
      });
    } else {
      if ((results[key] ?? {}).isFetched) {
        setStructure(prev => {
          let ret = {...prev};
          ret.catID = (results[key].data[0] ?? [null])[0];
          // (structure.catID will be false if it couldn't be found.)
          ret.isFetching = false;
          ret.isFetched = true;
          return ret;
        });
      }
    }

  // And finally, if catID is defined but falsy, it means that it doesn't
  // exist (for the given catSK (SK = Secondary Key)), in which case we
  // should let setArr = [[], [], ...].
  } else {
    setStructure(prev => {
      let ret = {...prev};
      ret.setArr = userIDArr.map(() => []);
      ret.isFetching = false;
      return ret;
    });
  }
}


function combineByPriority(setArr) {
  // setArr is imploded into concatArr, which is then sorted by instID.
  let concatSet = [].concat(...setArr).sort(
      (a, b) => a[1] - b[1]
  );
  // construct a return array by recording only the one rating for each
  // group of elements with the same instID in the concatArr, namely the
  // one with the smallest set generator index (val[2]).
  let ret = new Array(concatSet.length);
  let retLen = 0;
  let currInstID = 0;
  let row, minSetArrIndex, currSetArrIndex;
  concatSet.forEach(function(val, ind) {
      // if val is the first in a group with the same instID, record its
      // sgIndex and add a copy of val to the return array.
      if (val[1] !== currInstID) {
          currInstID = val[1];
          minSetArrIndex = val[2];
          ret[retLen] = (row = [val[0], currInstID, minSetArrIndex]);
          retLen++;
      // else compare the val[2] to the previous minSetArrIndex and change the
      // last row of the return array if it is smaller.
      } else {
          currSetArrIndex = val[2];
          if (currSetArrIndex > minSetArrIndex) {
              row[2] = (minSetArrIndex = currSetArrIndex);
          }
      }
  });
  // delete the empty slots of ret and return it.
  ret.length = retLen;
  return ret;
}


function combineByMaxRating(setArr) {
  // setArr is imploded into concatArr, which is then sorted by instID.
  let concatSet = [].concat(...setArr).sort(
      (a, b) => a[1] - b[1]
  );
  // construct a return array by recording only the one rating for each
  // group of elements with the same instID in the concatArr, namely the
  // one with the smallest set generator index (val[2]).
  let ret = new Array(concatSet.length);
  let retLen = 0;
  let currInstID = 0;
  let row, maxRatVal, currRatVal;
  concatSet.forEach(function(val, ind) {
      // if val is the first in a group with the same instID, record its
      // ratVal as the maxRatVal and add a copy of val to the return
      // array.
      if (val[1] !== currInstID) {
          currInstID = val[1];
          maxRatVal = val[0];
          ret[retLen] = (row = [maxRatVal, currInstID]);
          retLen++;
      // else compare the ratVal to the previous maxRatVal and change the
      // last row of the return array if it is larger.
      } else {
          currRatVal = val[0];
          if (currRatVal > maxRatVal) {
              row[0] = (maxRatVal = currRatVal);
          }
      }
  });
  // delete the empty slots of ret and return it.
  ret.length = retLen;
  return ret;
}