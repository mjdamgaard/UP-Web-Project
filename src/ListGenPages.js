import {useState, useMemo, useContext} from "react";
import {useQuery} from "./DBRequests.js";
// import {
//   MaxRatingSetCombiner, SimpleSetGenerator,
// } from "/src/SetGenerator.js";

import {AccountManagerContext} from "./contexts/AccountContext.js";

import {PagesWithTabs} from "./PagesWithTabs.js";
import {
  EntityID, FullEntityTitle, EntityTitle, ContextDisplay
} from "./EntityTitles.js";
import {EntListDisplay} from "./EntListDisplay.js";

import {
  SimpleEntListGenerator, MaxRatingEntListCombiner
} from "./EntListGenerator.js";



/* Placeholders */
// const EntityTitle = () => <template></template>;



export const ListGeneratorPage = ({lg}) => {

  return (
    <div className="list-gen-page">
      <div className="list-gen-page-header">
        <h2>Pending...</h2>
        {/* <div><EntityIDDisplay entID={entID} /></div> */}
      </div>
      <EntListDisplay listGenerator={lg} />
    </div>
  );
};