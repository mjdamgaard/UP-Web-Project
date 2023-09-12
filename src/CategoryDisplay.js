import {useState, useEffect, useMemo} from "react";
import {useQuery} from "./DBRequests.js";


// import {
//   MaxRatingSetCombiner, SimpleSetGenerator,
// } from "./SetGenerator.js";
// // import {
// //   sanitize
// // } from "/src/DBRequestManager.js";


/* Placeholders */
const CategoryDisplayHeader = () => <template></template>;
const CategoryElementsContainer = () => <template></template>;



const CategoryDisplay = ({catKeys, initOptions}) => {
  initOptions ??= {};
  const [options, setOptions] = useState({...initOptions});
  const [catData, setCatData] = useState([...catKeys]);

  const [results, setResults] = useState([]);
  useQuery(setResults, catKeys.map(val => {
    if (val.catID) {
      return false;
    } else {
      return {
        req: "entID",
        t: 2,
        c: val.cxtID,
        s: val.defStr,
      };
    }
  }));

  const catIDsAreReady = catKeys.reduce((acc, val, ind) => {
    acc && (!!val.catID || typeof results[ind] !== "undefined")
  }, true);

  // Before results is fetched, render this:
  if (!catIDsAreReady) {
    return (
      <div className="category-display">
        <CategoryDisplayHeader
          catData={catData} options={options} setOptions={setOptions}
        />
        <CategoryElementsContainer></CategoryElementsContainer>
      </div>
    );
  }
  
  // Afterwards, first record the fetched catIDs in the catData state.
  setCatData(prev => prev.map((val, ind) => {
    let ret = val;
    ret.catID ??= (results[ind][0] ?? [])[0];
    return ret;
  }));

  return (
    <div className="category-display">
      <CategoryDisplayHeader
        catData={catData} options={options} setOptions={setOptions}
      />
      <CategoryElementsContainer>
        {elements}
      </CategoryElementsContainer>
    </div>
  );
};

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
