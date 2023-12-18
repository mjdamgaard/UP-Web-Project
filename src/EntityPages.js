import {useState, useMemo, useContext} from "react";
import {useQuery} from "./DBRequests.js";
// import {
//   MaxRatingSetCombiner, SimpleSetGenerator,
// } from "/src/SetGenerator.js";

import {AccountManagerContext} from "./contexts/AccountContext.js";

import {PagesWithTabs} from "./PagesWithTabs.js";
import {EntityID, FullEntityTitle} from "./EntityTitles.js";
import {EntListDisplay} from "./EntListDisplay.js";
import {RatingElement} from "./Ratings.js";

import {
  SimpleEntListGenerator
} from "./EntListGenerator.js";



/* Placeholders */
const EntityTitle = () => <template></template>;
// const FullEntityTitle = () => <template></template>;
// const EntityIDDisplay = () => <template></template>;
const ContextDisplay = () => <template></template>;
const EntityInfoPage = () => <template></template>;
// const EntityRatingsPage = () => <template></template>;
// const PropertyCategoryPage = () => <template></template>;
const RelevantRatingsTypePage = () => <template></template>;
const RelevantPropertiesTypePage = () => <template></template>;
const SubmitEntityPage = () => <template></template>;
const SubmitTemplatePage = () => <template></template>;
// const CategoryInstancesPage = () => <template></template>;
const SubmitInstanceField = () => <template></template>;
const CategoryDisplay = () => <template></template>;



export const EntityPage = ({entID, initTab}) => {
  const [results, setResults] = useState([]);
  useQuery(results, setResults, {
    req: "ent",
    id: entID,
  });

  // Before results is fetched, render this:
  if (!results.isFetched) {
    return (
      <div className="entity-page">
        <div className="entity-page-header">
          <h2><EntityTitle entID={entID} /></h2>
          <span className="full-title">
            Full title: <FullEntityTitle entID={entID} />
          </span>
        </div>
      </div>
    );
  }
  
  // Afterwards, extract the needed data from results[0], then do a full render.
  const [typeID, cxtID, defStr] = (results.data[0] ?? []);

  // Construct the tabs on the EntityPage.
  const [tabDataArr, defaultTab] = getTabDataArrAndDefaultTab(
    entID, typeID, cxtID
  );
  initTab ??= defaultTab;

  return (
    <div className="entity-page">
      <div className="entity-page-header">
        <h2><EntityTitle entID={entID} /></h2>
        <span className="full-title">
          Full title: <FullEntityTitle entID={entID} />
        </span>
        <div><EntityIDDisplay entID={entID} /></div>
        <div><ContextDisplay cxtID={cxtID} /></div>
      </div>
      <PagesWithTabs tabDataArr={tabDataArr} initTab={initTab} />
    </div>
  );
};


function getTabDataArrAndDefaultTab(entID, typeID, cxtID) {
  let tabDataArr = [
    ["Info", <EntityInfoPage entID={entID} />],
    ["Ratings", <EntityRatingsPage entID={entID} typeID={typeID} />],
    ["Related to", <PropertyCategoryPage entID={entID} propID={42} />],
  ];
  let defaultTab;
  
  switch (typeID) {
    case 1:
      tabDataArr.push(
        ["Relevant ratings", <RelevantRatingsTypePage entID={entID} />],
        ["Relevant properties", <RelevantPropertiesTypePage entID={entID} />],
        ["Templates", <PropertyCategoryPage entID={entID} propID={85} />],
        ["Submit entity", <SubmitEntityPage entID={entID} />],
      );
      if (![1, 3, 4, 5, 7, 8].includes(entID)) {
        tabDataArr.push(
            ["Submit template", <SubmitTemplatePage entID={entID} />],
        );
      }
      defaultTab = "Relevant ratings";
      break;
    case 2:
      tabDataArr.push(
        ["Subcategories", <PropertyCategoryPage entID={entID} propID={37} />],
        ["Instances", <CategoryInstancesPage entID={entID} />],
        ["Supercategories", <PropertyCategoryPage entID={entID} propID={47} />],
        ["Submit instance", <SubmitCategoryInstancePage entID={entID} />],
      );
      defaultTab = "Subcategories";
      break;
    case 3:
      tabDataArr.push(
        ["Submit entity", <SubmitEntityPage entID={entID} />],
      );
      defaultTab = "Submit entity";
      break;
    default:
      defaultTab = "Info";
      break;
  }
  // TODO: Implement the following two tabs as well:
  // tabDataArr.push(
  //     ["Comments", <EntityCommentsPage />],
  //     ["Discussions", <EntityDiscussionsPage />],
  // );

  return [tabDataArr, defaultTab];
}



export const EntityIDDisplay = ({entID}) => {
  return (
    <span className="entity-id-display">
      ID: <EntityID entID={entID}/>
    </span>
  );
};



export const PropertyCategoryPage = ({propID, entID}) => {
  const accountManager = useContext(AccountManagerContext);

  // const structure = {
  //   type: "simple",
  //   catSK: {
  //     cxtID: 21,
  //     defStr: "#" + propID + "|#" + entID,
  //   }
  // };
  const listGenerator = useMemo(
    () => new SimpleEntListGenerator(
      {catSK: {cxtID: 21, defStr: "#" + propID + "|#" + entID}},
      accountManager
    ),
    [propID, entID]
  )

  return (
    <div>
      <EntListDisplay listGenerator={listGenerator} />
    </div>
  );
};


export const CategoryInstancesPage = ({entID}) => {
  const accountManager = useContext(AccountManagerContext);

  // const structure = {
  //   type: "simple",
  //   catID: entID,
  // };
  const listGenerator = useMemo(
    () => new SimpleEntListGenerator(
      {catID: entID},
      accountManager
    ),
    [entID]
  )

  return (
    <div>
      <EntListDisplay listGenerator={listGenerator} />
    </div>
  );
};



export const SubmitCategoryInstancePage = ({entID}) => {
  return (
    <div>
      <SubmitInstanceField entID={entID} />
    </div>
  );
};



// TODO: Continue refactoring:


export const EntityRatingsPage = ({entID, typeID}) => {
  const structure = {
    type: "max-rating-comb",
    children: [
      {
        type: "simple",
        catSK: {cxtID: 21, defStr: "#54|#" + entID},
      },
      {
        type: "simple",
        catSK: {cxtID: 21, defStr: "#52|#" + typeID},
      },
    ],
  };

  return (
    <div>
      <h4>Relevant ratings</h4>
      <EntListDisplay
        initStructure={structure} ElemComponent={RatingElement}
      />
    </div>
  );
};




// export var submitEntityPageCL = new ContentLoader(
//   "SubmitEntityPage",
//   /* Initial HTML template */
//   '<div>' +
//       '<<SubmitEntityField>>' +
//   '</div>',
//   sdbInterfaceCL
// );

// export var submitTemplatePageCL = new ContentLoader(
//   "SubmitTemplatePage",
//   /* Initial HTML template */
//   '<div>' +
//       '<<SubmitEntityField>>' +
//   '</div>',
//   sdbInterfaceCL
// );
// submitTemplatePageCL.addCallback("data", function(data) {
//   data.isTemplate = true;
// });


// export var relevantRatingsTypePageCL = new ContentLoader(
//   "RelevantRatingsTypePage",
//   /* Initial HTML template */
//   '<div>' +
//       '<h4>Relevant categories to rate for type instances of this type</h4>' +
//       '<<SetDisplay>>' +
//   '</div>',
//   sdbInterfaceCL
// );
// relevantRatingsTypePageCL.addCallback("data", function(data) {
//   data.copyFromAncestor("entID");
// });
// relevantRatingsTypePageCL.addCallback("data", function(data) {
//   data.elemContentKey = "GeneralEntityElement";
//   data.setGenerator = new SimpleSetGenerator(
//       {cxtID: 21, defStr: "#52|#" + data.entID}, // catKey.
//   );
// });

// export var relevantPropertiesTypePageCL = new ContentLoader(
//   "RelevantPropertiesTypePage",
//   /* Initial HTML template */
//   '<div>' +
//       '<h4>Relevant categories to rate for type instances of this type</h4>' +
//       '<<SetDisplay>>' +
//   '</div>',
//   sdbInterfaceCL
// );
// relevantPropertiesTypePageCL.addCallback("data", function(data) {
//   data.copyFromAncestor("entID");
// });
// relevantPropertiesTypePageCL.addCallback("data", function(data) {
//   data.elemContentKey = "GeneralEntityElement";
//   data.setGenerator = new SimpleSetGenerator(
//       {cxtID: 21, defStr: "#58|#" + data.entID}, // catKey.
//   );
// });





// export var entityInfoPageCL = new ContentLoader(
//   "EntityInfoPage",
//   /* Initial HTML template */
//   '<div>' +
//       '<<SetDisplay>>' +
//   '</div>',
//   sdbInterfaceCL
// );
// entityInfoPageCL.addCallback("data", function(data) {
//   data.copyFromAncestor([
//       "entID",
//       "typeID",
//   ]);
// });
// entityInfoPageCL.addCallback("data", function(data) {
//   data.elemContentKey = "SemanticPropertyElement";
//   let sg1 = new SimpleSetGenerator(
//       {cxtID: 21, defStr: "#58|#" + data.entID}, // catKey.
//       100, // num,
//   );
//   let sg2 = new SimpleSetGenerator(
//       {cxtID: 21, defStr: "#59|#" + data.typeID}, // catKey.
//       100, // num.
//   );
//   data.setGenerator = new MaxRatingSetCombiner([sg1, sg2]);
// });
