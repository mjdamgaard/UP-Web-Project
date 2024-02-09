import {useState, useEffect, useMemo, useContext} from "react";
import {AccountManagerContext} from "./contexts/AccountContext.js";
import {useQuery} from "./DBRequests.js";

import {DropdownBox, DropdownMenu} from "./DropdownBox.js";
import {EntityTitle, FullEntityTitle} from "./EntityTitles.js";
import {EntListDisplay} from "./EntListDisplay.js";
import {MissingCategoryDisplay} from "./Ratings.js";
import {
  SimpleEntListGenerator, WeightedAverageEntListCombiner,
  MaxRatingEntListCombiner, PriorityEntListCombiner,
  EntListGenerator,
  EntListQuerier,
  EntListCombiner,
} from "./EntListGenerator.js";


/* Placeholders */
const EntityTitlePlaceholder = () => <span></span>;
const MoveUpDownButtons = () => <template></template>;
const RelatedSortingMenuPoints = () => <template></template>;
// const SortingCategoryElement = () => <template></template>;
// const TypeMenuOfSortingCategoriesElement = () => <template></template>;


// Note: I imagine that users will be able to construct EntListGenerators
// however they want from this menu at some point, perhaps under an advanced
// menu. But for the initial implementation, there should just be the standard
// EntListGen and then the option to add more predicates to this search,
// with the ability to give a weight to each EntListGenerator (LG) / predicate
// after extra ones have been selected. I will also just let the extra
// predicates be selected from one list, that is used for all EntListMenus
// (Implemented via a predicate of 'useful predicates for searching').


// lg = listGenerator.

export const EntListHeader = ({lg, setLG}) => {
  return (
    <div className="ent-list-header">
      <DropdownBox>
        <div className="ent-list-menu">
          {/* <EntListCategoriesMenu lg={lg} /> */}
          {/* <InitCategoriesHeader initCatKeys={initCatKeys} /> */}
          <ListGeneratorMenu lg={lg} setLG={setLG} />
          <SortingCategoriesMenu lg={lg} setLG={setLG} />
        </div>
      </DropdownBox>
    </div>
  );
};


export const SortingCategoriesMenu = ({lg, setLG}) => {

  return (
    <div>
      <StandardSortingMenuPoint setLG={setLG} />
      <RelatedSortingMenuPoints lg={lg} setLG={setLG} />
    </div>
  );
};



export const StandardSortingMenuPoint = ({setLG}) => {
  const accountManager = useContext(AccountManagerContext);
  const [typeLG, ] = useState(
    new SimpleEntListGenerator(
      {catID: 11},
      accountManager,
      6, //TODO: Change so that this is handed to the EntListContainer instead.
    )
  );

  return (
    <DropdownMenu title={
      <span>Relevant sorting categories for each type</span>
    }>
      <EntListDisplay
        listGenerator={typeLG}
        ElemComponent={TypeMenuOfSortingCategoriesElement}
        extraProps={{setLG: setLG}}
      />
    </DropdownMenu>
  );
};


export const TypeMenuOfSortingCategoriesElement = ({entID, setLG}) => {
  const accountManager = useContext(AccountManagerContext);
  const [catLG, ] = useState(
    new SimpleEntListGenerator(
      {catSK: {cxtID: 21, defStr: "#52|#" + entID}},
      accountManager,
      15, //TODO: Change so that this is handed to the EntListContainer instead.
    )
  );
  
  return (
    <div>
      <DropdownMenu title={<EntityTitle entID={entID} />}>
        <div>
          <h5>
            Relevant sorting categories for the type{" "}
            <EntityTitle entID={entID} isLink />
          </h5>
          <EntListDisplay
            listGenerator={catLG}
            ElemComponent={SortingCategoryElement}
            extraProps={{setLG: setLG}}
          />
        </div>
      </DropdownMenu>
    </div>
  );
};

export const SortingCategoryElement = ({entID, setLG}) => {
  // TODO: I should make accountManager a global instead of a context variable.
  const accountManager = useContext(AccountManagerContext);
  
  return (
    <div>
      <EntityTitle entID={entID} isLink/>{" "}
      <button onClick={() => {
        addSortingCategory(entID, setLG, accountManager);
      }}>
        Add sorting category
      </button>
    </div>
  );
};

export function addSortingCategory(entID, setLG, accountManager) {
  setLG(prev => {debugger;
    let ret = prev; // We don't care that prev is changed via side-effects.
    if (!(ret instanceof WeightedAverageEntListCombiner)) {
      ret = new WeightedAverageEntListCombiner([prev], [1]);
    }

    let newLG = new SimpleEntListGenerator(
      {catID: entID},
      accountManager,
    )

    ret.entListGeneratorArr.push(newLG);
    ret.weightArr.push(0.5);
    return ret;
  });
}






export const ListGeneratorMenu = ({lg, setLG}) => {
  switch (true) {
    case (lg instanceof SimpleEntListGenerator):
      return (
        <SimpleLGMenu lg={lg} setLG={setLG} />
      );
    case (lg instanceof EntListQuerier):
      return (
        <QuerierLGMenu lg={lg} setLG={setLG} />
      );
    case (lg instanceof PriorityEntListCombiner):
      return (
        // (SimpleEntListGenerator extends PriorityEntListCombiner.)
        <PriorityCombinerMenu lg={lg} setLG={setLG} />
      );
    case (lg instanceof MaxRatingEntListCombiner):
      return (
        <MaxRatingCombinerLGMenu lg={lg} setLG={setLG} />
      );
    case (lg instanceof WeightedAverageEntListCombiner):
      return (
        <WeightedAverageCombinerLGMenu lg={lg} setLG={setLG} />
      );
    default:
      return (
        <span>ListGeneratorMenu: EntListGenerator not implemented yet</span>
      );
  }
};



export const SimpleLGMenu = ({lg, setLG}) => {
  const catKey = useMemo(() => lg.getCatKeys()[0], [lg]);
  return (
    <div>
      <CategoryDisplay catKey={catKey} />
      {/* TODO: Implement changing to see the full PriorityCombinerLGMenu. */}
    </div>
  );
};

export const QuerierLGMenu = ({lg, setLG}) => {
  const catKey = useMemo(() => lg.getCatKeys()[0], [lg]);
  return (
    <div>
      <CategoryDisplay catKey={catKey} />
      {/* TODO: Implement menu to change query parameters. */}
    </div>
  );
};


export const CategoryDisplay = ({catKey}) => {
  const catID = catKey.catID;
  if (catID) {
    return (
      <div>
        <EntityTitle entID={catID} isLink={true} />
      </div>
    );
  }

  // If catID is falsy, see if it is fetched yet, and if not, load a
  // placeholder:
  if (catID === undefined) {
    return (
      <div>
        <EntityTitlePlaceholder />
      </div>
    );
  }

  // If catID is fetched but still falsy, load MissingCategoryDisplay.
  return (
    <MissingCategoryDisplay catSK={catKey.catSK} />
  );
};



/* Combiner ListGenerators */

export const useChildLGStates = (lg, setLG) => {
  if (!(lg instanceof EntListCombiner)) {
    throw "useChildLGStates: combinerLG is not instance of EntListCombiner";
  }
  const childLGArr = lg.entListGeneratorArr;
  const childLGSetterArr = lg.entListGeneratorArr.map((val, ind) => (
    // We need to treat the LGs as mutable in the setters.
    y => {
      setLG(prev => {
        prev.entListGeneratorArr[ind] = (y instanceof Function) ?
          y(prev.entListGeneratorArr[ind]) : y;
        return prev;
        // let ret = {...prev};
        // ret.entListGeneratorArr[ind] = (y instanceof Function) ?
        //   y(ret.entListGeneratorArr[ind]) : y;
        // return ret;
      });
    }
  ));
  return [childLGArr, childLGSetterArr];
};

export const useLGArrStates = (lg, setLG) => {
  if (!(lg instanceof EntListCombiner)) {
    throw "useLGArrStates: combinerLG is not instance of EntListCombiner";
  }
  const lgArr = lg.entListGeneratorArr;
  const setLGArr = (
    y => {
      setLG(prev => {
        prev.entListGeneratorArr = (y instanceof Function) ?
          y(prev.entListGeneratorArr) : y;
        return prev;
        // let ret = {...prev};
        // ret.entListGeneratorArr = (y instanceof Function) ?
        //   y(ret.entListGeneratorArr) : y;
        // return ret;
      });
    }
  );
  return [lgArr, setLGArr];
};


var nonce = 0;
export function getNonce() {
  return ++nonce;
}

export const PriorityCombinerMenu = ({lg, setLG}) => {
  const [lgArr, lgSetterArr] = useChildLGStates(lg, setLG);
  const [, setLGArr] = useLGArrStates(lg, setLG);

  const keyPrefix = useMemo(
    () => getNonce(),
    [lg]
  );
  const children = lgArr.map((val, ind) => (
    <div key={keyPrefix + "." + ind}>
        <MoveUpDownButtons ind={ind} setArr={setLGArr} />
        <ListGeneratorMenu lg={val} setLG={lgSetterArr[ind]} />
    </div>
  ));

  return (
    <div>
      {children}
    </div>
  );
};

export const MaxRatingCombinerLGMenu = ({lg, setLG}) => {
  const [lgArr, lgSetterArr] = useChildLGStates(lg, setLG);

  const keyPrefix = useMemo(
    () => getNonce(),
    [lg]
  );
  const children = lgArr.map((val, ind) => (
    <div key={keyPrefix + "." + ind}>
        <ListGeneratorMenu lg={val} setLG={lgSetterArr[ind]} />
    </div>
  ));

  return (
    <div>
      {children}
    </div>
  );
};

export const WeightedAverageCombinerLGMenu = ({lg, setLG}) => {
  const [lgArr, lgSetterArr] = useChildLGStates(lg, setLG);

  const keyPrefix = useMemo(
    () => getNonce(),
    [lg]
  );
  const children = lgArr.map((val, ind) => (
    <div key={keyPrefix + "." + ind}>
        <ListGeneratorMenu lg={val} setLG={lgSetterArr[ind]} />
    </div>
  ));

  return (
    <div>WeightedAverageCombinerLGMenu
      {children}
    </div>
  );
};



// export const LGWeightSlider = ({lg, setLG}) => {
//   return (
//     <div>
//     </div>
//   );
// };










export function getAssocEntIDsFromDefStr(defStr) {
  return defStr
    .match(/#[1-9][0-9]*/g)
    .filter((val, ind, arr) => arr.indexOf(val) === ind)
    .map(val => val.substring(1));
}

export function getExpandedCatKeyArr(catKeys) {
  let expandedCatKeyArrArr = catKeys
    .map(val => {
      if (val.catSK === undefined || val.catSK.defStr === undefined) {
        throw "getExpandedCatKeyArr: catKeys need to contain catSKs.";
      }
      let assocCatKeys = getAssocEntIDsFromDefStr(val.catSK.defStr)
        .map(val => ({catID: val}));
      return [val].concat(...assocCatKeys);
    });

  let expandedCatKeyArr = [].concat(...expandedCatKeyArrArr)
    .map(val => JSON.stringify(val))
    .filter((val, ind, arr) => arr.indexOf(val) === ind)
    .map(val => JSON.parse(val))
  
  return expandedCatKeyArr;
}








// I wasn't done with this out-commented implementation below: I was about to
// change AssocEntIDs to AssocEntCatKeys instead.

// export const SortingCategoriesMenu = ({initCatKeys, setLG}) => {

//   return (
//     <FetchAllEntIDsFromDefinitionThenRender initCatKeys={initCatKeys}
//       renderFun={(AssocEntIDs, isFetched) => {
//         if (!isFetched) {
//           return (
//             <div></div>
//           );
//         } else {
//           return (
//             <SortingCategoriesMenuFetched AssocEntIDs={AssocEntIDs} />
//           );
//         }
//       }}
//     />
//   );
// };

// export const SortingCategoriesMenuFetched = ({initCatKeys, setLG}) => {

//   return (
//     <div>SortingCategoriesMenuFetched...</div>
//   );
// };



// export const FetchCatKeysThenRender = ({initCatKeys, renderFun}) => {
//   // Fetch all catIDs and catSKs for all initCatKeys if missing, then render
//   // the return JSX element by calling renderFun(catKeys, isFetched).
//   const [results, setResults] = useState([]);
//   useQuery(results, setResults, initCatKeys.map(val => {
//     let catID = val.catID;
//     let catSK = val.catSK;
//     if (catID && catSK) {
//       return {};
//     }
//     if (!catID) {
//       return {
//         req: "entID",
//         t: 2,
//         c: catSK.cxtID,
//         s: catSK.defStr,
//       };
//     }
//     if (!catSK) {
//       return {
//         req: "ent",
//         t: 2,
//         c: catSK.cxtID,
//         s: catSK.defStr,
//       };
//     }
//   }));

//   const isFetched = results.reduce(
//     (acc, val) => acc && val.isFetched,
//     true
//   );
//   if (!isFetched) {
//     return renderFun(catKeys, isFetched);
//   }

//   const catKeys = initCatKeys.map((val, ind) => {
//     let catID = val.catID;
//     let catSK = val.catSK;
//     if (catID && catSK) {
//       return val;
//     }
//     if (!catID) {
//       return {
//         catID: results[ind].data[0],
//         catSK: catSK,
//       };
//     }
//     if (!catSK) {
//       return {
//         catID: catID,
//         catSK: {
//           cxtID: results[ind].data[1],
//           defStr: results[ind].data[2],
//         }
//       };
//     }
//   });

//   return renderFun(catKeys, isFetched);
// };


// export const FetchAllEntIDsFromDefinitionThenRender = ({
//   initCatKeys, renderFun
// }) => {
//   // Fetch all catIDs and catSKs by calling FetchCatKeysThenRender, then render
//   // return JSX element of renderFun(AssocEntIDs, isFetched).
//   return (
//     <FetchCatKeysThenRender
//       initCatKeys={initCatKeys}
//       renderFun={(catKeys, isFetched) => {
//         if (!isFetched) {
//           return (
//             <div></div>
//           );
//         } else {
//           return (
//             <FetchAllEntIDsFromDefinitionThenRenderFetchedKeys
//               catKeys={catKeys}
//               renderFun={(AssocEntIDs, isFetched) => {
//                 if (!isFetched) {
//                   return (
//                     <div></div>
//                   );
//                 } else {
//                   return renderFun(AssocEntIDs, isFetched);
//                 }
//               }}
//             />
//           );
//         }
//       }}
//     />
//   );
// };

// export const FetchAllEntIDsFromDefinitionThenRenderFetchedKeys = ({
//   catKeys, renderFun
// }) => {
//   let initJSONCatKeys = catKeys.map(val => JSON.stringify(val));
//   let expandedCatKeyArr = getExpandedCatKeyArr(catKeys);
//   let isDone = expandedCatKeyArr.reduce(
//     (acc, val) => acc && initJSONCatKeys.includes(JSON.stringify(val)),
//     true
//   );
  
//   if (isDone) {
//     return renderFun(AssocEntIDs, isFetched);
//   }

//   return renderFun(AssocEntIDs, isFetched);
// };


// export function getAssocEntIDsFromDefStr(defStr) {
//   return defStr
//     .match(/#[1-9][0-9]*/g)
//     .filter((val, ind, arr) => arr.indexOf(val) === ind)
//     .map(val => val.substring(1));
// }

// export function getExpandedCatKeyArr(catKeys) {
//   let expandedCatKeyArrArr = catKeys
//     .map(val => {
//       if (val.catSK === undefined || val.catSK.defStr === undefined) {
//         throw "getExpandedCatKeyArr: catKeys need to contain catSKs.";
//       }
//       let assocCatKeys = getAssocEntIDsFromDefStr(val.catSK.defStr)
//         .map(val => ({catID: val}));
//       return [val].concat(...assocCatKeys);
//     });

//   let expandedCatKeyArr = [].concat(...expandedCatKeyArrArr)
//     .map(val => JSON.stringify(val))
//     .filter((val, ind, arr) => arr.indexOf(val) === ind)
//     .map(val => JSON.parse(val))
  
//   return expandedCatKeyArr;
// }


