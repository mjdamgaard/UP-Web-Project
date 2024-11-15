import {useState, useMemo, useContext, useCallback} from "react";
import {useDispatch} from "../../../../hooks/useDispatch.js";

import {basicEntIDs} from "../../../../entity_ids/basic_entity_ids.js";

import {SubpagesWithTabs} from "./SubpagesWithTabs.js";
import {EntityList} from "../../../entity_lists/EntityList.js";

/* Placeholders */
const TabHeader = () => <template></template>;


const MEMBERS_REL_ID = basicEntIDs["relations/members"];
const SUBCLASSES_REL_ID = basicEntIDs["relations/subclasses"];

export const RelationSubpage = ({objID, relID}) => {

  const getPageCompFromID = useCallback(tabID => {
    if (tabID == entID) {
      return [AllMembersPage, {entID: entID}];
    }
    return [ClassSubpage, {entID: tabID}];
  });

  const initTabsJSON = JSON.stringify([
    [entID, "All"],
  ]);
  const tabScaleKeysJSON = JSON.stringify([
    [entID, SUBCLASSES_REL_ID],
  ]);

  return (
    <SubpagesWithTabs
      initTabsJSON={[initTabsJSON]}
      getPageCompFromID={getPageCompFromID}
      getTabTitleFromID="Name"
      tabScaleKeysJSON={tabScaleKeysJSON}
    />
  );
};



export const AllMembersPage = ({entID}) => {
  return (
    <EntityList scaleKey={JSON.stringify([entID, MEMBERS_REL_ID])}/>
  );
};
