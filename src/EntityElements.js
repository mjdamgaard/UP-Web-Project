import {useState, useEffect, useMemo, useContext} from "react";
import {AccountManagerContext} from "./contexts/AccountContext.js";
import {useQuery} from "./DBRequests.js";

import {EntityTitle, FullEntityTitle} from "./EntityTitles.js";
import {DropdownBox} from "./DropdownBox.js";
import {EntityIDDisplay} from "./EntityPages.js";
// import {} from "./EntListDisplay.js";
import {RatingDisplay} from "./Ratings.js";


// const EntityTitle = () => <template></template>;
// const RatingDisplay = () => <template></template>;



// Maybe we don't want all the elements to rerender, if the user changes the
// instance set structure (state), so let us, at least for this implementation,
// just let the "element rating display" show the value that was calculated by
// the combineProcedure.



export const GeneralEntityElement = ({entID, combScore, listGenerator}) => {
  return (
    <div className="general-entity-element">
      <div>
        <h4>
          <EntityTitle entID={entID} isLink={true} />
        </h4>
        {/* TODO: Make the score update when user logs in and out. */}
        <ElementRatingDisplay combScore={combScore} />
      </div>
      <DropdownBox>
        <div className="general-element-dropdown-page">
          <div>Full title: <FullEntityTitle entID={entID} /></div>
          <div><EntityIDDisplay entID={entID} /></div>
          <SetCategoriesRatingsDisplay
            entID={entID} listGenerator={listGenerator}
          />
        </div>
      </DropdownBox>
    </div>
  );
};



export const ElementRatingDisplay = ({combScore}) => {
  return (
    <div className="element-rating-display">
      {(combScore / 6553.5).toFixed(1)}
    </div>
  );
};



export const SetCategoriesRatingsDisplay = ({entID, listGenerator}) => {
  const catKeys = listGenerator.getCatKeys();
  const children = catKeys.map((val) => (
    <RatingDisplay key={JSON.stringify(val.catSK ?? val.catID)}
      catKey={val} instID={entID}
    />
  ));

  return (
    <div className="set-categories-ratings-display">
      {children}
    </div>
  );
};


// TODO: Continue refactoring:


// export var semanticPropertyElementCL = new ContentLoader(
//   "SemanticPropertyElement",
//   /* Initial HTML template */
//   '<div>' +
//     '<<SemanticPropertyTitle>>' +
//     '<<SetDisplay data:wait>>' +
//   '</div>',
//   sdbInterfaceCL
// );
// semanticPropertyElementCL.addCallback("data", function(data) {
//   data.copyFromAncestor([
//     "entID",
//     "columnEntityID",
//   ]);
// });
// semanticPropertyElementCL.addCallback(function($ci, data) {
//   $ci.on("toggle", function() {
//     let $this = $(this);
//     if (!data.setDisplayIsLoaded) {
//       data.setDisplayIsLoaded = true;
//       let reqData = {
//         req: "ent",
//         id: data.entID,
//       };
//       dbReqManager.query($ci, reqData, data, function($ci, result, data) {
//         let defStr = (result[0] ?? [""])[2];
//         let defItemStrArr = defStr
//           .replaceAll("\\\\", "&bsol;")
//           .replaceAll("\\|", "&#124;")
//           .split("|");
//         let type = defItemStrArr[1];
//         let quantityWord = defItemStrArr[2];
//         switch (type) {
//           case "#7": // the "Text data" type.
//             data.elemContentKey = "TextDataDisplayElement";
//           break;
//           case "#64": // the "Time" type.
//             data.elemContentKey = "DefStrDisplayElement";
//           break;
//           // TODO: Add more of these type--CL pairings when needed.
//           default:
//             data.elemContentKey = "GeneralEntityElement";
//           break;
//         }
//         switch (quantityWord) {
//           case "one":
//             data.initialNum = 1;
//             data.incrementNum = 1;
//           break;
//           case "few":
//             data.initialNum = 6;
//             data.incrementNum = 6;
//           break;
//           case "many":
//             data.initialNum = 50;
//             data.incrementNum = 50;
//           break;
//           default:
//             if (/^[1-9][0-9]{0,2}$/.test(quantityWord)) {
//               data.initialNum = parseInt(quantityWord);
//               data.incrementNum = parseInt(quantityWord);
//             } else {
//               data.initialNum = 50;
//               data.incrementNum = 50;
//             }
//           break;
//         }
//         data.setGenerator = new SimpleSetGenerator(
//           {
//             cxtID: 21,
//             defStr: "#" + data.entID + "|#" + data.columnEntityID,
//           },
//           null, // num.
//           36864, // ratingLo (= CONV("9000", 16, 10)).
//         );
//         $this.children('.CI.SetDisplay').trigger("load");
//       });
//     } else {
//       $this.children('.CI.SetDisplay').toggle();
//     }
//     return false;
//   });
// });
// export var semanticPropertyTitleCL = new ContentLoader(
//   "SemanticPropertyTitle",
//   /* Initial HTML template */
//   '<h3>' +
//     '<<DropdownButton>>' +
//     '<<EntityTitle>>' +
//   '</h3>',
//   sdbInterfaceCL
// );
// semanticPropertyTitleCL.addCallback("data", function(data) {
//   data.isLinkArr = [];
// });
// semanticPropertyTitleCL.addCallback(function($ci, data) {
//   $ci.on("click", function() {
//     let $this = $(this);
//     $this.children('.CI.DropdownButton').trigger("toggle-button-symbol");
//     $this.trigger("toggle");
//     return false;
//   });
// });



// export var defStrDisplayElementCL = new ContentLoader(
//   "DefStrDisplayElement",
//   /* Initial HTML template */
//   '<div></div>',
//   sdbInterfaceCL
// );
// defStrDisplayElementCL.addCallback("data", function(data) {
//   data.copyFromAncestor("entID");
// });
// defStrDisplayElementCL.addCallback(function($ci, data) {
//   let reqData = {
//     req: "ent",
//     id: data.entID,
//   };
//   dbReqManager.query($ci, reqData, data, function($ci, result, data) {
//     let defStr = (result[0] ?? [""])[2];
//     $ci.append(defStr);
//   });
// });




// export var categoryForSortingElementCL = new ContentLoader(
//   "CategoryForSortingElement",
//   /* Initial HTML template */
//   '<div>' +
//     '<<EntityTitle>>' +
//   '</div>',
//   sdbInterfaceCL
// );
