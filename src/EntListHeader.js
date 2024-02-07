import {useState, useEffect, useMemo, useContext} from "react";
import {AccountManagerContext} from "./contexts/AccountContext.js";
import {useQuery} from "./DBRequests.js";

import {DropdownBox} from "./DropdownBox.js";
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
// const SortingCategoriesMenu = () => <span></span>;
// const RelevantCategoriesDisplay = () => <span></span>;
// const QuerierLGMenu = () => <template></template>;
// const MaxRatingCombinerLGMenu = () => <template></template>;
// const WeightedAverageCombinerLGMenu = () => <template></template>;
const MoveUpDownButtons = () => <template></template>;


// Note: I imagine that users will be able to construct EntListGenerators
// however they want from this menu at some point, perhaps under an advanced
// menu. But for the initial implementation, there should just be the standard
// EntListGen and then the option to add more predicates to this search,
// with the ability to give a weight to each EntListGenerator (LG) / predicate
// after extra ones have been selected. I will also just let the extra
// predicates be selected from one list, that is used for all EntListMenus
// (Implemented via a predicate of 'useful predicates for searching').


// lg = listGenerator.

export const EntListHeader = ({
  lg, setLG, initCatKeys, filterOptions, setFilterOptions
}) => {
  return (
    <div className="ent-list-header">
      <DropdownBox>
        <div className="ent-list-menu">
          {/* <EntListCategoriesMenu lg={lg} /> */}
          {/* <InitCategoriesHeader initCatKeys={initCatKeys} /> */}
          <ListGeneratorMenu lg={lg} setLG={setLG} initCatKeys={initCatKeys} />
          {/* <SortingCategoriesMenu initCatKeys={initCatKeys} setLG={setLG} /> */}
        </div>
      </DropdownBox>
    </div>
  );
};



export const ListGeneratorMenu = ({lg, setLG, initLG}) => {
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
  return (
    <div>
      <CategoryDisplay catKey={lg.getCatKeys()[0]} />
      {/* TODO: Implement changing to see the full PriorityCombinerLGMenu. */}
    </div>
  );
};

export const QuerierLGMenu = ({lg, setLG}) => {
  return (
    <div>
      <CategoryDisplay catKey={lg.getCatKeys()[0]} />
      {/* TODO: Implement menu to change query parameters. */}
    </div>
  );
};



export const useChildLGStates = (lg, setLG) => {
  if (!lg instanceof EntListCombiner) {
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
  if (!lg instanceof EntListCombiner) {
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




export const SortingCategoriesMenu = ({initCatKeys, setLG}) => {

  return (
    <FetchAllEntIDsFromDefinitionThenRender initCatKeys={initCatKeys}
      renderFun={(AssocEntIDs, isFetched) => {
        if (!isFetched) {
          return (
            <div></div>
          );
        } else {
          return (
            <SortingCategoriesMenuFetched AssocEntIDs={AssocEntIDs} />
          );
        }
      }}
    />
  );
};

export const SortingCategoriesMenuFetched = ({initCatKeys, setLG}) => {

  return (
    <div>SortingCategoriesMenuFetched...</div>
  );
};



export const FetchCatKeysThenRender = ({initCatKeys, renderFun}) => {
  // Fetch all catIDs and catSKs for all initCatKeys if missing, then render
  // the return JSX element by calling renderFun(catKeys, isFetched).
  const [results, setResults] = useState([]);
  useQuery(results, setResults, initCatKeys.map(val => {
    let catID = val.catID;
    let catSK = val.catSK;
    if (catID && catSK) {
      return {};
    }
    if (!catID) {
      return {
        req: "entID",
        t: 2,
        c: catSK.cxtID,
        s: catSK.defStr,
      };
    }
    if (!catSK) {
      return {
        req: "ent",
        t: 2,
        c: catSK.cxtID,
        s: catSK.defStr,
      };
    }
  }));

  const isFetched = results.reduce(
    (acc, val) => acc && val.isFetched,
    true
  );
  if (!isFetched) {
    return renderFun(catKeys, isFetched);
  }

  const catKeys = initCatKeys.map((val, ind) => {
    let catID = val.catID;
    let catSK = val.catSK;
    if (catID && catSK) {
      return val;
    }
    if (!catID) {
      return {
        catID: results[ind].data[0],
        catSK: catSK,
      };
    }
    if (!catSK) {
      return {
        catID: catID,
        catSK: {
          cxtID: results[ind].data[1],
          defStr: results[ind].data[2],
        }
      };
    }
  });

  return renderFun(catKeys, isFetched);
};


export const FetchAllEntIDsFromDefinitionThenRender = ({
  initCatKeys, renderFun
}) => {
  // Fetch all catIDs and catSKs by calling FetchCatKeysThenRender, then render
  // return JSX element of renderFun(AssocEntIDs, isFetched).
  return (
    <FetchCatKeysThenRender
      initCatKeys={initCatKeys}
      renderFun={(catKeys, isFetched) => {
        if (!isFetched) {
          return (
            <div></div>
          );
        } else {
          return (
            <FetchAllEntIDsFromDefinitionThenRenderFetchedKeys
              catKeys={catKeys}
              renderFun={(AssocEntIDs, isFetched) => {
                if (!isFetched) {
                  return (
                    <div></div>
                  );
                } else {
                  return renderFun(AssocEntIDs, isFetched);
                }
              }}
            />
          );
        }
      }}
    />
  );
};

export const FetchAllEntIDsFromDefinitionThenRenderFetchedKeys = ({
  catKeys, renderFun
}) => {
  let initJSONCatKeys = catKeys.map(val => JSON.stringify(val));
  let expandedCatKeyArr = getExpandedCatKeyArr(catKeys);
  let isDone = expandedCatKeyArr.reduce(
    (acc, val) => acc && initJSONCatKeys.includes(JSON.stringify(val)),
    true
  );
  
  if (isDone) {
    return renderFun(AssocEntIDs, isFetched);
  }

  return renderFun(AssocEntIDs, isFetched);
};


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








// export const EntListCategoriesMenu = ({lg}) => {
//   const catKeys = lg.getCatKeys();
//   if (catKeys.includes(null)) {
//     return (
//       <div>
//         <h5>Categories</h5>
//       </div>
//     );
//   }
//   const children = catKeys.map(val => (
//     <CategoryDisplay
//       key={JSON.stringify(val.catSK ?? val.catID)} catKey={val}
//     />
//   ));

//   return (
//     <div>
//       <h5>Categories</h5>
//       {children}
//     </div>
//   );
// };


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


