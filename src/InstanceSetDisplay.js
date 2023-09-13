import {useState, useEffect, useMemo, useContext} from "react";
import {AccountManagerContext} from "./contexts/AccountContext.js";
import {useQuery} from "./DBRequests.js";


// import {
//   MaxRatingSetCombiner, SimpleSetGenerator,
// } from "./SetGenerator.js";
// // import {
// //   sanitize
// // } from "/src/DBRequestManager.js";


/* Placeholders */
const InstanceSetDisplayHeader = () => <template></template>;
const InstanceSetContainer = () => <template></template>;



export const InstanceSetDisplay = ({initStructure, initFilterOptions}) => {
  initFilterOptions ??= {};
  // const [structure, setStructure] = useState(
  //   Object.assign({isFetching: false, isFetched: false}, initStructure)
  // );
  const [structure, setStructure] = useState({...initStructure});
  const [filterOptions, setFilterOptions] = useState({...initFilterOptions});
  const accountManager = useContext(AccountManagerContext);
  const [reqData, setReqData] = useState({});
  const [results, setResults] = useState({});
  useQuery(results, setResults, reqData);

  updateStructureAndRequests(
    structure, results, reqData, setReqData, accountManager
  );

  // Before combined set is, render this:
  if (!structure.set) {
    return (
      <div className="category-display">
        <InstanceSetDisplayHeader
          catData={catKeys} structure={structure} setStructure={setStructure}
          filterOptions={filterOptions} setFilterOptions={setFilterOptions}
        />
        <InstanceSetContainer set={null}/>
      </div>
    );
  }

  // And when it is ready, render the full component:
  return (
    <div className="category-display">
      <InstanceSetDisplayHeader
        catData={catKeys} structure={structure} setStructure={setStructure}
        filterOptions={filterOptions} setFilterOptions={setFilterOptions}
      />
      <InstanceSetContainer set={structure.set} setStructure={setStructure} />
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
// one catID and queries that categoery with all users/bots in
// accountManager.queryUserPriorityArr, then select the rating values of the
// first user/bot in that array if it exists, and if not it selects that of
// the next user/bot in the array, and so on.

// Each node in the "structure" defining the instance set has at least a
// "type" property and a "set" property, which has a falsy value if the set
// is not yet ready. The outermost node (at least) also has a property
// "isFetching" for when the leaf sets are queried for but has not arraived,
// and a property "isFetched" for when they have arrived (but the "set" is
// not necessarily ready yet).
// The inner nodes of the structure tree also all have a "children" property.
// The various node types might also have other proporties. For instance, the
// "simple" nodes will have a "catID" property.

function updateStructureAndRequests(
  structure, results, reqData, setReqData, accountManager
) {
  // If the set is already ready, return true.
  if (structure.set) {
    return true;
  }

  // Else switch-case the node type and update the results and reqData when
  // possible. By using setReqData for the latter, it means that the queries
  // will be forwarded in the useQuery() call above, and when they return,
  // updateStructureAndRequests() will be called again to make further updates. 
  switch (structure.type) {
    case "simple":
      if (typeof structure.catID === "undefined") {
        let catKey = structure.catKey;
        let data = {
          req: "entID",
          t: 2,
          c: catKey.cxtID,
          s: catKey.defStr,
        };
        let key = JSON.stringify(data);

        // Look in reqData to see if the catID is already being fetched, and
        // if not, initiate the fetching by updating reqData.
        if (!reqData[key]) {
          setReqData(prev => {
            let ret = {...prev};
            ret[key] = data;
            return ret;
          });
        }
      } else {
        accountManager.queryUserPriorityArr.forEach(userID => {
          let data = {
            req: "set",
            u: userID,
            c: structure.catID,
            rl: 0,
            rh: 0,
            n: 4000,
            o: 0,
            a: 0,
          };
          let key = JSON.stringify(data);

          // Look in reqData to see if this set is already being fetched, and
          // if not, initiate the fetching by updating reqData.
          if (!reqData[key]) {
            setReqData(prev => {
              let ret = {...prev};
              ret[key] = data;
              return ret;
            });

          // Else, since the structure.set is not ready yet, look up to see
          // if ...
          }
        });
      }
      break;
    default:
      throw "updateSetStructure(): unrecognized node type."
  }
}


  // const catIDsReqData = useMemo(() => catKeys.map(val => {
  //   if (val.catID) {
  //     return false;
  //   } else {
  //     return {
  //       req: "entID",
  //       t: 2,
  //       c: val.cxtID,
  //       s: val.defStr,
  //     };
  //   }
  // }));

  // const [reqData, setReqData] = useState({
  //   catIDs: catIDsReqData
  // });
  // const [results, setResults] = useState({
  //   catIDs: catIDsReqData.map(val => (
  //     val ? {data: null, isFetched: false} : undefined
  //   ))
  // });
  // useQuery(results, setResults, reqData);


  // const catIDsAreReady = results.catIDs.reduce((acc, val, ind) => {
  //   acc && (val.isFetched || !catIDsReqData[ind])
  // }, true);

  // const initialHTML = (
  //   <div className="category-display">
  //     <InstanceSetDisplayHeader
  //       catData={catKeys} structure={structure} setStructure={setStructure}
  //       filterOptions={filterOptions} setFilterOptions={setFilterOptions}
  //     />
  //     <InstanceSetContainer set={null}/>
  //   </div>
  // );
  // // Before results is fetched, render this:
  // if (!catIDsAreReady) {
  //   return (
  //     <>
  //       {initialHTML}
  //     </>
  //   );
  // }
  
  // // Afterwards, first record the fetched catIDs in the catData state.
  // const catData = catKeys.map((val, ind) => {
  //   let ret = val;
  //   ret.catID ??= (results.catIDs[ind].data[0] ?? [])[0];
  //   return ret;
  // });

  // // In this implementation, we will only query for each set once, namely by
  // // querying for the first 4000 (e.g.) elements at once and non other than
  // // that. We can therefore make these queries right away. The "structure" of
  // // the instance set then defines how these sets are combined and sorted.
  // // TODO: Reimplement at some point so that InstanceSetDisplay can query for
  // // more elements than the initial ones if the user requests it (e.g. by
  // // scrolling past enough elements).
  // // Oh, and in this implementation, we will only use the "simple" set
  // // structures as the leaves of the combined structure tree, which each takes
  // // one catID and queries that categoery with all users/bots in
  // // accountManager.queryUserPriorityArr, then select the rating values of the
  // // first user/bot in that array if it exists, and if not it selects that of
  // // the next user/bot in the array, and so on.

  // // Each node in the "structure" defining the instance set has at least a
  // // "type" property and a "set" property, which has a falsy value if the set
  // // is not yet ready. The outermost node (at least) also has a property
  // // "isFetching" for when the leaf sets are queried for but has not arraived,
  // // and a property "isFetched" for when they have arrived (but the "set" is
  // // not necessarily ready yet).
  // // The inner nodes of the structure tree also all have a "children" property.
  // // The various node types might also have other proporties. For instance, the
  // // "simple" nodes will have a "catID" property.

  // // When the combined set is finally ready, render the full component:
  // if (structure.set) {
  //   return (
  //     <div className="category-display">
  //       <InstanceSetDisplayHeader
  //           catData={catKeys} structure={structure} setStructure={setStructure}
  //           filterOptions={filterOptions} setFilterOptions={setFilterOptions}
  //       />
  //       <InstanceSetContainer set={structure.set} setStructure={setStructure} />
  //     </div>
  //   );
  // }



  // // But before that, we should first see if the leaf sets are already fetched,
  // // and if so, we should compute the comined set. 
  // if (structure.isFetched) {
  //   computeCombinedSet(structure, setStructure);

  //   return (
  //     <>
  //       {initialHTML}
  //     </>
  //   );
  // }

  // // And before the leaf sets are fetched, we should check that they are not
  // // not already being fetched, and if not, we should query for them.
  // if (!structure.isFetching) {
  //   structure.isFetching = true;
  //   queryForAllLeafSets(structure, setStructure, setReqData);
  //   setStructure(prev => {
  //     let ret = {...prev};
  //     ret.isFetching = true;
  //     return ret;
  //   }); // This statement should be redundant here, but it won't be if the
  //   // component should change when the leaf sets are being fethed. 
  // }

  // return (
  //   <>
  //     {initialHTML}
  //   </>
  // );
// };


// function queryForAllLeafSets(structure, setStructure, setReqData) {
//   if (structure.type === "simple") {

//   }
// }


// function computeCombinedSet(structure, setStructure) {

// }



export var setDisplayCL = new ContentLoader(
  "SetDisplay",
  /* Initial HTML template */
  '<div>' +
    '<<SetHeader>>' +
    '<div class="set-container"></div>' +
    '<<AppendMoreElementsButton>>' +
  '</div>',
  sdbInterfaceCL
);
setDisplayCL.addCallback("data", function(data) {
  data.copyFromAncestor([
    "elemContentKey",
    "setGenerator",
  ]);
  data.copyFromAncestor(["initialNum", "incrementNum"], 1);
  data.initialNum ??= 50;
  data.incrementNum ??= 50;
});
setDisplayCL.addCallback(function($ci, data) {
  $ci.one("initial-elements-loaded", function() {
    let $this = $(this);
    $this.on("append-elements", function(event, set) {
      let $this = $(this);
      let data = $this.data("data");
      let currNum = data.currentNum;
      if (currNum >= data.set.length) {
        return;
      }
      let newNum = currNum + data.incrementNum;
      data.listElemDataArr = data.set.slice(currNum, newNum).map(val => ({
        ratVal: val[0],
        entID: val[1],
      }));
      data.currentNum = currNum + data.listElemDataArr.length;
      let $setContainer = $this.children('.set-container');
      setDisplayCL.loadAppended($setContainer, "List", data);
      return false;
    });
    return false;
  });
  data.cl = setDisplayCL.getRelatedCL(data.elemContentKey);
  $ci.one("load-initial-elements", function(event, set) {
    let $this = $(this);
    let data = $this.data("data");
    data.set = set;
    data.listElemDataArr = set.slice(0, data.initialNum).map(val => ({
      ratVal: val[0],
      entID: val[1],
    }));
    data.currentNum = data.listElemDataArr.length;
    let $setContainer = $this.children('.set-container');
    setDisplayCL.loadAppended($setContainer, "List", data);
    $this.trigger("initial-elements-loaded");
    return false;
  });
  data.setGenerator.generateSet($ci, function($ci, set) {
    $ci.trigger("load-initial-elements", [set]);
  });
});


export var appendMoreElementsButtonCL = new ContentLoader(
  "AppendMoreElementsButton",
  /* Initial HTML template */
  '<<DropdownButtonBar>>',
  sdbInterfaceCL
);
appendMoreElementsButtonCL.addCallback(function($ci, data) {
  $ci.on("click", function() {
    $(this).trigger("append-elements");
    return false;
  });
});


export var setHeaderCL = new ContentLoader(
  "SetHeader",
  /* Initial HTML template */
  '<<DropdownBox>>',
  sdbInterfaceCL
);
setHeaderCL.addCallback("data", function(data) {
  data.dropdownCL = setHeaderCL.getRelatedCL("SetMenu");
});

export var dropdownBoxCL = new ContentLoader(
  "DropdownBox",
  /* Initial HTML template */
  '<div>' +
    '<<SelfReplacer data:wait>>' +
    '<<DropdownButtonBar>>' +
  '</div>',
  sdbInterfaceCL
);
dropdownBoxCL.addCallback("data", function(data) {
  data.cl = data.getFromAncestor("dropdownCL");
});
dropdownBoxCL.addCallback(function($ci, data) {
  $ci.one("click", function() {
    let $this = $(this);
    $this.find('.CI.DropdownButton')
      .trigger("toggle-button-symbol")
      .on("click", function() {
        $(this).trigger("toggle-button-symbol")
          .closest('.CI.DropdownBox').children().first().toggle();
        return false;
      });
    $this.find('.CI.SelfReplacer').trigger("load");
    return false;
  });
});
export var dropdownButtonBarCL = new ContentLoader(
  "DropdownButtonBar",
  /* Initial HTML template */
  '<div>' +
    '<<DropdownButton>>' +
  '</div>',
  sdbInterfaceCL
);
export var dropdownButtonCL = new ContentLoader(
  "DropdownButton",
  /* Initial HTML template */
  '<span>' +
    '<span class="caret"></span>' +
    // '<span class="glyphicon glyphicon-triangle-bottom"></span>' +
  '</span>',
  sdbInterfaceCL
);
dropdownButtonCL.addCallback(function($ci, data) {
  data.symbolIsDown = true;
  $ci.on("toggle-button-symbol", function() {
    let $this = $(this);
    let data = $this.data("data");
    if (data.symbolIsDown) {
      $this.addClass('dropup');
      data.symbolIsDown = false;
    } else {
      $this.removeClass('dropup');
      data.symbolIsDown = true;
    }
    return false;
  });
});

export var setMenurCL = new ContentLoader(
  "SetMenu",
  /* Initial HTML template */
  '<div>' +
    '<<SetCategoriesList>>' +
    // TODO: Implement these:
    // '<<SortingCategoriesMenu>>' +
    // '<<RelevantCategoriesSetDisplay>>' +
  '</div>',
  sdbInterfaceCL
);

export var setCategoriesListCL = new ContentLoader(
  "SetCategoriesList",
  /* Initial HTML template */
  '<div>' +
  '</div>',
  sdbInterfaceCL
);
setCategoriesListCL.addCallback("data", function(data) {
  data.copyFromAncestor([
    "setGenerator",
  ]);
});
setCategoriesListCL.addCallback(function($ci, data) {
  let catIDArr = data.setGenerator.getSetCategoryKeys();
  catIDArr.forEach(function(val) {
    if (!isNaN(parseInt(val))) {
      setCategoriesListCL.loadAppended(
        $ci, "CategoryDisplay", new DataNode(data, {
          entID: val,
        })
      );
    } else {
      let catKey = JSON.parse(val);
      setCategoriesListCL.loadAppended(
        $ci, "MissingCategoryDisplay", new DataNode(data, catKey)
      );
    }
  });
});
export var categoryDisplayCL = new ContentLoader(
  "CategoryDisplay",
  /* Initial HTML template */
  '<div>' +
    '<<EntityTitle>>' +
  '</div>',
  sdbInterfaceCL
);

export var missingCategoryDisplayCL = new ContentLoader(
  "MissingCategoryDisplay",
  /* Initial HTML template */
  '<div>' +
    '<span class="text-info">' +
      'Missing category.' +
    '</span>' +
  '</div>',
  sdbInterfaceCL
);
missingCategoryDisplayCL.addCallback("data", function(data) {
  data.copyFromAncestor([
    "cxtID",
    "defStr",
  ]);
});
missingCategoryDisplayCL.addCallback(function($ci, data) {
  data.inputUserID = accountManager.inputUserID;
  if (data.inputUserID) {
    $ci.append(
      ' <span class="text-info">' +
        'Want to submit it? ' +
        '<button class="btn btn-default submit">Submit</button>' +
      '</span>'
    );
    $ci.find('button.submit').on("click", function() {
      $(this).trigger("submit-category");
      return false;
    });
    $ci.on("submit-category", function() {
      let reqData = {
        req: "ent",
        ses: accountManager.sesIDHex,
        u: data.inputUserID,
        r: 1,
        t: 2,
        c: data.cxtID,
        s: data.defStr,
      };
      let $ci = $(this);
      dbReqManager.input($ci, reqData, data, function($ci, result, data) {
        if (result.exitCode == 0) {
          $ci.html(
            '<span class="text-success">' +
              'Category successfully submitted!' +
            '</span>'
          );
          let newData = new DataNode(data, {entID: result.outID});
          $ci.trigger("open-column", ["AppColumn", newData, "right"]);
        } else {
          $ci.html(
            '<span class="text-warning">' +
              'An error occurred' +
            '</span>'
          );
        }
      });
      return false;
    });
  } else {
    $ci.append(
      ' <span class="text-warning">' +
        '(Log in or sign up in order to submit it.)' +
      '</span>'
    );
  }
});


export var sortingCategoriesMenuCL = new ContentLoader(
  "SortingCategoriesMenu",
  /* Initial HTML template */
  '<div>' +
  '</div>',
  sdbInterfaceCL
);


export var relevantCategoriesSetDisplayCL = new ContentLoader(
  "RelevantCategoriesSetDisplay",
  /* Initial HTML template */
  '<<DropdownBox>>',
  sdbInterfaceCL
);
relevantCategoriesSetDisplayCL.addCallback("data", function(data) {
  data.copyFromAncestor([
    "entID",
    "typeID",
  ]);
  data.dropdownCL = relevantCategoriesSetDisplayCL.getRelatedCL(
    "SetDisplay"
  );
});
relevantCategoriesSetDisplayCL.addCallback("data", function(data) {
  // TODO: Implement this.
});
