import {useState, useMemo, useContext} from "react";
import {useQuery} from "./DBRequests.js";
// import {
//   MaxRatingSetCombiner, SimpleSetGenerator,
// } from "/src/SetGenerator.js";

import {AccountManagerContext} from "./contexts/AccountContext.js";
import {ColumnContext} from "./contexts/ColumnContext.js";

import {PagesWithTabs} from "./PagesWithTabs.js";
import {
  EntityID, FullEntityTitle, EntityTitle, ContextDisplay
} from "./EntityTitles.js";
import {EntListDisplay} from "./EntListDisplay.js";

import {
  SimpleEntListGenerator, MaxRatingEntListCombiner
} from "./EntListGenerator.js";



/* Placeholders */
const RelevantCategoriesDropdownMenuButton = () => <template></template>;
const AddCombinerButton = () => <template></template>;



export const ListGeneratorPage = ({lg}) => {

  var headerContent;
  switch (lg.getType()) {
    case "EntListQuerier":
      headerContent = "atomic list";
      break;
    case "SimpleEntListGenerator":
      headerContent = "simple list";
      break;
    case "MaxRatingEntListCombiner":
      headerContent = "max rating list";
      break;
    case "PriorityEntListCombiner":
      headerContent = <PriorityLGHeaderContent lg={lg}/>;
      break;
    case "WeightedAverageEntListCombiner":
      headerContent = "weighted average list";
      break;
  }

  return (
    <div className="list-gen-page">
      <div className="list-gen-page-header">
        {headerContent}
      </div>
      <EntListDisplay listGenerator={lg} />
    </div>
  );
};



export const ListGeneratorSmallMenu = ({lg}) => {
  return (
    <span>
      <AddCombinerButton lg={lg} />
      <ListGeneratorLink lg={lg} />
    </span>
  );
};


export const ListGeneratorLink = ({lg}) => {
  const [, columnManager] = useContext(ColumnContext);

  var linkContent;
  switch (lg.getType()) {
    case "EntListQuerier":
      linkContent = "atomic list";
      break;
    case "SimpleEntListGenerator":
      linkContent = "simple list";
      break;
    case "MaxRatingEntListCombiner":
      linkContent = "max rating list";
      break;
    case "PriorityEntListCombiner":
      linkContent = "priority list";
      break;
    case "WeightedAverageEntListCombiner":
      linkContent = "weighted average list";
      break;
  }
  return (
    <span className="list-gen-link clickable-text" onClick={() => {
      columnManager.openColumn({lg: lg})
    }}>
      {linkContent}
    </span>
  );
};




export const PriorityLGHeaderContent = ({lg}) => {
  var childLists; //...
  return (
    <>
      <h2>Priority list</h2>
      <p>
        Combines several lists such that each entity in the union of the
        lists gets the rating from the first list in which they appear.
      </p>
      <ul>
        {childLists}
      </ul>
    </>
  );
};