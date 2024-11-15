import {useState, useMemo, useContext} from "react";

import {basicEntIDs} from "../../entity_ids/basic_entity_ids.js";
import {DataFetcher, getScaleDefStr, hashPromise} from "../../classes/DataFetcher";

/* Placeholders */
const OpenedTabList = () => <template></template>;
const SettingsMenu = () => <template></template>;
const SubmitEntityMenu = () => <template></template>;


const CLASSES_CLASS_ID = basicEntIDs["classes"];
const RELATIONS_CLASS_ID = basicEntIDs["relations"];
const RELATIONS_REL_ID = basicEntIDs["relations/relations"];
const RELEVANT_QUAL_ID = basicEntIDs["qualities/relevant"];


export const EntityList = ({scaleKey, userID}) => {
  userID ??= "1"; // (TODO: Remove.)

  // scaleKey = scaleID | JSON.stringify([relID, objID, qualID?]).
  const [state, setState] = useState({
    entList: null,
    scaleIDIsMissing: null,
  });
  const {entList, scaleIDIsMissing} = state;

  // If the entity list is ready, return the entity list.
  if (Array.isArray(entList)) {
    return (
      <div className="entity-list">
        {JSON.stringify(entList)}
      </div>
    );
  }

  // Else if scaleIDIsMissing (from the database) is true, load a page where
  // the user can submit it.
  if (scaleIDIsMissing) {
    return (
      <div>TODO: Make this a page to submit missing scaleID.</div>
    );
  }

  // Else fetch it.
  DataFetcher.fetchEntityListFromScaleKey(
    userID, JSON.parse(scaleKey), null, null, null, (entList) => {
        setState(prev => ({
          ...prev,
          entList: entList,
        }))
      }
  );
  // And return a placeholder.
  return <>...</>;
};
