import {useState, useEffect, useMemo, useContext} from "react";
import {AccountManagerContext} from "./contexts/AccountContext.js";
import {useQuery} from "./DBRequests.js";



/* Placeholders */
const InstanceSetContainer = () => <template></template>;



export const InstanceSetDisplayHeader = ({set, setStructure}) => {
  return (
    <div className="set-display-header">
      
    </div>
  );
};





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
