import {useState, useMemo, useContext, useCallback} from "react";
import {useDispatch} from "../../../../hooks/useDispatch";

import {SubpagesWithTabs} from "./SubpagesWithTabs.js";
import {EntityList} from "../../../entity_lists/EntityList.js";

/* Placeholders */
const TabHeader = () => <template></template>;

// TODO: Refactor to import from single location instead.
const MEMBERS_REL_ID = "26";
const SUBCLASSES_REL_ID = "27";

export const ClassSubpage = ({entID}) => {

  const getPageCompFromID = useCallback(tabID => {
    if (tabID == entID) {
      return [AllMembersPage, {entID: tabID}];
    }
    // TODO: Handle arbitrary IDs of subclasses.
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
