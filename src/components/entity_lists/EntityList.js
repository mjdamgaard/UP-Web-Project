import {useState, useMemo, useContext} from "react";

import {DataFetcher} from "../../../classes/DataFetcher";
import {EntityReference} from "../../entity_refs/EntityReference";
import {EntityInfoPage} from "./subpages/InfoPage";
import {DropdownMenu} from "../../menus/DropdownMenu";
import {PagesWithTabs} from "../tabs/PagesWithTabs";

/* Placeholders */
const OpenedTabList = () => <template></template>;
const SettingsMenu = () => <template></template>;
const SubmitEntityMenu = () => <template></template>;

// TODO: Import from one location instead:
const CLASSES_CLASS_ID = "4";
const USEFUL_RELATIONS_REL_ID = "19";


export const EntityList = ({scaleKey, userID}) => {
  userID ??= "1"; // (TODO: Remove.)

  // scaleKey = scaleID | [relID, objID, qualID?].
  const [results, setState] = useState({});

  // TODO: Make a conditional query to get the scaleID, then query for the
  // (whole) entity list.

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

  const {datatype, defStr, isContained, isFetched} = results;

  // Before results is fetched, render this:
  if (!results.isFetched) {
    return (
      <></>
    );
  }
 
  return (
    <div className="entity-list">
    </div>
  );
};
