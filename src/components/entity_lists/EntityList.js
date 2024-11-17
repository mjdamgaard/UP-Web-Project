import {useState, useMemo, useContext} from "react";

import {basicEntIDs} from "../../entity_ids/basic_entity_ids.js";
import {DataFetcher} from "../../classes/DataFetcher";
import {GeneralEntityElement} from "./elements/GeneralEntityElement.js";

/* Placeholders */
const OpenedTabList = () => <template></template>;
const SettingsMenu = () => <template></template>;
const SubmitEntityMenu = () => <template></template>;


const CLASSES_CLASS_ID = basicEntIDs["classes"];
const RELATIONS_CLASS_ID = basicEntIDs["relations"];
const RELATIONS_REL_ID = basicEntIDs["relations/relations"];
const RELEVANT_QUAL_ID = basicEntIDs["qualities/relevant"];


export const EntityList = ({scaleKey, userID, n, lo, hi, o, a, ElemComp}) => {
  userID ??= "1"; // (TODO: Remove.)

  // scaleKey = scaleID | JSON.stringify([relID, objID, qualID?]).
  const [state, setState] = useState({
    entList: null,
    scaleIDIsMissing: null,
  });
  const {entList, scaleIDIsMissing} = state;

  ElemComp = ElemComp ?? GeneralEntityElement;

  // If the entity list is ready, return the entity list.
  if (Array.isArray(entList)) {
    return (
      <div className="entity-list">
        {entList.map(([score, entID]) => (
          <ElemComp key={entID} entID={entID} score={score} />
        ))}
      </div>
    );
  }

  // Else if scaleIDIsMissing (from the database) is true, load a page where
  // the user can submit it.
  if (scaleIDIsMissing) {
    return (
      <div>
        TODO: Make this a page to submit missing scaleID. *No, we just submit
        it when adding the first entity.
      </div>
    );
  }

  // Else fetch it.
  DataFetcher.fetchEntityListFromScaleKey(
    userID, JSON.parse(scaleKey), n, lo, hi, o, a, (entList) => {
        setState(prev => ({
          ...prev,
          entList: entList,
        }))
      }
  );
  // And return a placeholder.
  return <>...</>;
};
