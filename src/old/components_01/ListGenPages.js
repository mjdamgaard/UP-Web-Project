import {useState, useMemo, useContext} from "react";
import {useQuery} from "../hooks/DBRequests.js";
// import {
//   MaxRatingSetCombiner, SimpleSetGenerator,
// } from "/src/SetGenerator.js";

import {AccountManagerContext} from "./AccountContext.js";
import {ColumnContext} from "../hooks/ColumnContext.js";

import {PagesWithTabs} from "./PagesWithTabs.js";
import {
  EntityID, FullEntityTitle, EntityTitle, ContextDisplay
} from "./entity_titles/EntityTitles.js";
import {InstListDisplay} from "./InstListDisplay.js";

import {
  SimpleInstListGenerator, MaxRatingInstListCombiner
} from "../classes/InstListGenerator.js";



/* Placeholders */
const RelevantCategoriesDropdownMenuButton = () => <template></template>;
const AddCombinerButton = () => <template></template>;



export const ListGeneratorPage = ({lg}) => {

  var headerContent;
  switch (lg.getType()) {
    case "InstListQuerier":
      headerContent = "atomic list";
      break;
    case "SimpleInstListGenerator":
      headerContent = "simple list";
      break;
    case "MaxRatingInstListCombiner":
      headerContent = "max rating list";
      break;
    case "PriorityInstListCombiner":
      headerContent = <PriorityLGHeaderContent lg={lg}/>;
      break;
    case "WeightedAverageInstListCombiner":
      headerContent = "weighted average list";
      break;
  }

  return (
    <div className="list-gen-page">
      <div className="list-gen-page-header">
        {headerContent}
      </div>
      <InstListDisplay listGenerator={lg} />
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
    case "InstListQuerier":
      linkContent = "atomic list";
      break;
    case "SimpleInstListGenerator":
      linkContent = "simple list";
      break;
    case "MaxRatingInstListCombiner":
      linkContent = "max rating list";
      break;
    case "PriorityInstListCombiner":
      linkContent = "priority list";
      break;
    case "WeightedAverageInstListCombiner":
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