import {useState, useEffect, useMemo, useContext} from "react";
import {AccountManagerContext} from "./contexts/AccountContext.js";
import {useQuery} from "./DBRequests.js";

import {DropdownBox} from "./DropdownBox.js";
import {EntityTitle, FullEntityTitle} from "./EntityTitles.js";
import {InstanceSetDisplay, getCatKeys} from "./InstanceSetDisplay.js";
import {MissingCategoryDisplay} from "./Ratings.js";


/* Placeholders */
const EntityTitlePlaceholder = () => <span>...</span>;
// const EntityTitlePlaceholder = () => <template></template>;



export const InstanceSetHeader = ({
  structure, setStructure, filterOptions, setFilterOptions
}) => {
  return (
    <div className="set-header">
      <DropdownBox>
        <div className="set-menu">
          <SetCategoriesList structure={structure}/>
          {/* TODO: Implement these: */}
          {/* <SortingCategoriesMenu /> */}
          {/* <RelevantCategoriesSetDisplay /> */}
        </div>
      </DropdownBox>
    </div>
  );
};

// export const SetMenu = ({structure}) => {
//   return (
//     <div>
//       <SetCategoriesList />
//       {/* TODO: Implement these: */}
//       {/* <SortingCategoriesMenu /> */}
//       {/* <RelevantCategoriesSetDisplay /> */}
//     </div>
//   );
// };


export const SetCategoriesList = ({structure}) => {
  const catKeys = getCatKeys(structure);
  const children = catKeys.map((val) => (
    <CategoryDisplay key={val.catID ?? val.catSK} catKey={val} />
  ));

  return (
    <div>
      {children}
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
  if (!catKey.isFetched) {
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



// TODO: Implement SortingCategoriesMenu etc.

// export var sortingCategoriesMenuCL = new ContentLoader(
//   "SortingCategoriesMenu",
//   /* Initial HTML template */
//   '<div>' +
//   '</div>',
//   sdbInterfaceCL
// );


// export var relevantCategoriesSetDisplayCL = new ContentLoader(
//   "RelevantCategoriesSetDisplay",
//   /* Initial HTML template */
//   '<<DropdownBox>>',
//   sdbInterfaceCL
// );
// relevantCategoriesSetDisplayCL.addCallback("data", function(data) {
//   data.copyFromAncestor([
//     "entID",
//     "typeID",
//   ]);
//   data.dropdownCL = relevantCategoriesSetDisplayCL.getRelatedCL(
//     "SetDisplay"
//   );
// });
// relevantCategoriesSetDisplayCL.addCallback("data", function(data) {
//   // TODO: Implement this.
// });
