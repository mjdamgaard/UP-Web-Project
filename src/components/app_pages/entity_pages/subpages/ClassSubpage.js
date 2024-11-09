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
      return [MembersPage, {entID: entID}];
    }
    // TODO: Handle arbitrary IDs of subclasses.
  });

  const initTabsJSON = JSON.stringify([
    ["All", entID],
  ]);
  const tabScaleKeysJSON = JSON.stringify([
    [SUBCLASSES_REL_ID, entID],
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



export const MembersPage = ({entID}) => {
  return (
    <EntityList scaleKey={JSON.stringify([MEMBERS_REL_ID, entID])}/>
  );
};
