import {useState, useMemo, useContext} from "react";

import {basicEntIDs} from "../../../entity_ids/basic_entity_ids.js";
import {DataFetcher} from "../../../classes/DataFetcher.js";
import {useDispatch} from "../../../hooks/useDispatch.js";
import {EntityReference} from "../../entity_refs/EntityReference.js";

/* Placeholders */
const OpenedTabList = () => <template></template>;
const SettingsMenu = () => <template></template>;
const SubmitEntityMenu = () => <template></template>;


const CLASSES_CLASS_ID = basicEntIDs["classes"];
const RELATIONS_CLASS_ID = basicEntIDs["relations"];
const RELATIONS_REL_ID = basicEntIDs["relations/relations"];
const RELEVANT_QUAL_ID = basicEntIDs["qualities/relevant"];


export const TabEntityElement = ({entID, score}) => {
  const [results, setState] = useState({});

  useMemo(() => {
    DataFetcher.fetchPublicSmallEntity(
      entID, (datatype, defStr, len, creatorID, isContained) => {
        setState(prev => {
          return {
            ...prev,
            datatype: datatype,
            defStr: defStr,
            len: len,
            creatorID: creatorID,
            isContained: isContained,
            isFetched: true,
          };
        });
      }
    );
  }, []);

  const [dispatch] = useDispatch();

  // Before the data is fetched, render this.
  if (!results.isFetched) {
    return (
      <div className="tab-entity-element fetching">
        <EntityReference entID={entID} />
        {"@" + entID + ", " + score}
      </div>
    );
  }

  if (results.datatype !== "j") {
    // TODO...
  }

  return (
    <div className="tab-entity-element" onClick={(event) => {
      dispatch(event.target, "ELEMENT_SELECTED", entID);
    }}>
      <EntityReference entID={entID} />
      {"@" + entID + ", " + score}
    </div>
  );
};
