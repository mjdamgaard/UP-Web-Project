import {useState, createContext, useContext, useEffect} from "react";

import {useQuery} from "./DBRequests.js";
import {
  MaxRatingSetCombiner, SimpleSetGenerator,
} from "/src/SetGenerator.js";

import {PagesWithTabs} from "./PagesWithTabs.js";

/* Placeholders */
const EntityTitle = () => <template></template>;
const FullEntityTitle = () => <template></template>;
const EntityIDDisplay = () => <template></template>;
const ContextDisplay = () => <template></template>;

const EntityInfoPage = () => <template></template>;
const EntityRatingsPage = () => <template></template>;
const PropertyCategoryPage = () => <template></template>;
const RelevantRatingsTypePage = () => <template></template>;
const RelevantPropertiesTypePage = () => <template></template>;
const SubmitEntityPage = () => <template></template>;
const SubmitTemplatePage = () => <template></template>;
const CategoryInstancesPage = () => <template></template>;
const SubmitCategoryInstancePage = () => <template></template>;



export const EntityPage = ({entID, initTab}) => {
  const [results, setResults] = useState([]);
  useQuery(setResults, 0, {
    req: "ent",
    id: data.entID,
  });

  // Before results is fetched, render this:
  if (typeof results[0] === "undefined") {
    return (
      <div className="entity-page">
        <div className="entity-page-header">
          <h2><EntityTitle entID={entID} /></h2>
          <span class="full-title">Full title: <FullEntityTitle /></span>
        </div>
      </div>
    );
  }
  // Afterwards, extract the needed data from results[0], then do a full render.
  const [typeID, cxtID, defStr] = (result[0] ?? []);

  // Construct the tabs on the EntityPage.
  const [tabDataArr, defaultTab] = getTabDataArrAndDefaultTab(
    entID, typeID, cxtID
  );
  initTab ??= defaultTab;

  return (
    <div className="entity-page">
      <div className="entity-page-header">
        <h2><EntityTitle entID={entID} /></h2>
        <span class="full-title">Full title: <FullEntityTitle /></span>
        <div><EntityIDDisplay entID={entID} /></div>
        <div><ContextDisplay cxtID={cxtID} /></div>
      </div>
      <PagesWithTabs tabDataArr={tabDataArr} initTab={initTab} />
    </div>
  );
};

function getTabDataArrAndDefaultTab(entID, typeID, cxtID) {
  let tabDataArr = [
    ["Info", <EntityInfoPage />],
    ["Ratings", <EntityRatingsPage />],
    ["Related to", <PropertyCategoryPage propID={42} />],
  ];
  let defaultTab;
  
  switch (typeID) {
    case 1:
      tabDataArr.push(
        ["Relevant ratings", <RelevantRatingsTypePage />],
        ["Relevant properties", <RelevantPropertiesTypePage />],
        ["Templates", <PropertyCategoryPage propID={85} />],
        ["Submit entity", <SubmitEntityPage />],
      );
      if (![1, 3, 4, 5, 7, 8].includes(entID)) {
        tabDataArr.push(
            ["Submit template", <SubmitTemplatePage />],
        );
      }
      defaultTab = "Relevant ratings";
      break;
    case 2:
      tabDataArr.push(
        ["Subcategories", <PropertyCategoryPage propID={37} />],
        ["Instances", <CategoryInstancesPage />],
        ["Supercategories", <PropertyCategoryPage propID={47} />],
        ["Submit instance", <SubmitCategoryInstancePage />],
      );
      defaultTab = "Subcategories";
      break;
    case 3:
      tabDataArr.push(
        ["Submit entity", <SubmitEntityPage />],
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




export var entIDDisplayCL = new ContentLoader(
  "EntityIDDisplay",
  /* Initial HTML template */
  '<span>ID: </span>',
  sdbInterfaceCL
);
entIDDisplayCL.addCallback(function($ci, data) {
  $ci.append('#' + data.getFromAncestor("entID"));
});


export var propertyCategoryPageCL = new ContentLoader(
  "PropertyCategoryPage",
  /* Initial HTML template */
  '<div>' +
      '<<SetDisplay>>' +
  '</div>',
  sdbInterfaceCL
);
propertyCategoryPageCL.addCallback("data", function(data) {
  data.copyFromAncestor([
      "propID",
      "entID",  // optional.
  ]);
});
propertyCategoryPageCL.addCallback("data", function(data) {
  data.elemContentKey = "GeneralEntityElement";
  data.setGenerator = new SimpleSetGenerator(
      {cxtID: 21, defStr: "#" + data.propID + "|#" + data.entID}, // catKey.
      // (21 is the ID of the "<Property> of <Entity>" template.)
  );
});


export var categoryInstancesPageCL = new ContentLoader(
  "CategoryInstancesPage",
  /* Initial HTML template */
  '<div>' +
      '<<SetDisplay>>' +
  '</div>',
  sdbInterfaceCL
);
categoryInstancesPageCL.addCallback("data", function(data) {
  data.elemContentKey = "GeneralEntityElement";
  data.setGenerator = new SimpleSetGenerator(
      data.getFromAncestor("entID"), // catKey.
  );
});


export var submitCategoryInstancePageCL = new ContentLoader(
  "SubmitCategoryInstancePage",
  /* Initial HTML template */
  '<div>' +
      '<<SubmitInstanceField>>' +
  '</div>',
  sdbInterfaceCL
);





export var entityRatingsPageCL = new ContentLoader(
  "EntityRatingsPage",
  /* Initial HTML template */
  '<div>' +
      '<h4>Relevant ratings</h4>' +
      '<<SetDisplay>>' +
  '</div>',
  sdbInterfaceCL
);
entityRatingsPageCL.addCallback("data", function(data) {
  data.copyFromAncestor([
      "entID",
      "typeID",
  ]);
});
entityRatingsPageCL.addCallback("data", function(data) {
  // Relevant categories:
  data.elemContentKey = "RatingElement";
  let sg1 = new SimpleSetGenerator(
      {cxtID: 21, defStr: "#54|#" + data.entID}, // catKey.
  );
  let sg2 = new SimpleSetGenerator(
      {cxtID: 21, defStr: "#52|#" + data.typeID}, // catKey.
  );
  data.setGenerator = new MaxRatingSetCombiner([sg1, sg2]);
});
entityRatingsPageCL.addCallback("data", function(data) {
  data.instID = data.getFromAncestor("columnEntityID");
});



export var submitEntityPageCL = new ContentLoader(
  "SubmitEntityPage",
  /* Initial HTML template */
  '<div>' +
      '<<SubmitEntityField>>' +
  '</div>',
  sdbInterfaceCL
);

export var submitTemplatePageCL = new ContentLoader(
  "SubmitTemplatePage",
  /* Initial HTML template */
  '<div>' +
      '<<SubmitEntityField>>' +
  '</div>',
  sdbInterfaceCL
);
submitTemplatePageCL.addCallback("data", function(data) {
  data.isTemplate = true;
});


export var relevantRatingsTypePageCL = new ContentLoader(
  "RelevantRatingsTypePage",
  /* Initial HTML template */
  '<div>' +
      '<h4>Relevant categories to rate for type instances of this type</h4>' +
      '<<SetDisplay>>' +
  '</div>',
  sdbInterfaceCL
);
relevantRatingsTypePageCL.addCallback("data", function(data) {
  data.copyFromAncestor("entID");
});
relevantRatingsTypePageCL.addCallback("data", function(data) {
  data.elemContentKey = "GeneralEntityElement";
  data.setGenerator = new SimpleSetGenerator(
      {cxtID: 21, defStr: "#52|#" + data.entID}, // catKey.
  );
});

export var relevantPropertiesTypePageCL = new ContentLoader(
  "RelevantPropertiesTypePage",
  /* Initial HTML template */
  '<div>' +
      '<h4>Relevant categories to rate for type instances of this type</h4>' +
      '<<SetDisplay>>' +
  '</div>',
  sdbInterfaceCL
);
relevantPropertiesTypePageCL.addCallback("data", function(data) {
  data.copyFromAncestor("entID");
});
relevantPropertiesTypePageCL.addCallback("data", function(data) {
  data.elemContentKey = "GeneralEntityElement";
  data.setGenerator = new SimpleSetGenerator(
      {cxtID: 21, defStr: "#58|#" + data.entID}, // catKey.
  );
});





export var entityInfoPageCL = new ContentLoader(
  "EntityInfoPage",
  /* Initial HTML template */
  '<div>' +
      '<<SetDisplay>>' +
  '</div>',
  sdbInterfaceCL
);
entityInfoPageCL.addCallback("data", function(data) {
  data.copyFromAncestor([
      "entID",
      "typeID",
  ]);
});
entityInfoPageCL.addCallback("data", function(data) {
  data.elemContentKey = "SemanticPropertyElement";
  let sg1 = new SimpleSetGenerator(
      {cxtID: 21, defStr: "#58|#" + data.entID}, // catKey.
      100, // num,
  );
  let sg2 = new SimpleSetGenerator(
      {cxtID: 21, defStr: "#59|#" + data.typeID}, // catKey.
      100, // num.
  );
  data.setGenerator = new MaxRatingSetCombiner([sg1, sg2]);
});
