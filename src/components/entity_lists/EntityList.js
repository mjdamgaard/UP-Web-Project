import {useState, useMemo, useContext} from "react";

import {DataFetcher} from "../../classes/DataFetcher";

/* Placeholders */
const OpenedTabList = () => <template></template>;
const SettingsMenu = () => <template></template>;
const SubmitEntityMenu = () => <template></template>;

// TODO: Import from one location instead:
const CLASSES_CLASS_ID = "4";
const RELATIONS_CLASS_ID = "7";
const USEFUL_RELATIONS_REL_ID = "19";
const RELEVANCY_QUAL_ID = "15";


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
    userID, JSON.parse(scaleKey), null, (entList, scaleID) => {
      if (!scaleID) {
        setState(prev => ({
          ...prev,
          scaleIDIsMissing: true,
        }))
      }
      else {
        setState(prev => ({
          ...prev,
          entList: entList,
          scaleIDIsMissing: false,
        }))
      }
    }
  );
  // And return a placeholder.
  return <>...</>;
};
