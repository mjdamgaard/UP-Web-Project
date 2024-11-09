import {useState, useMemo, useContext} from "react";
import {useDispatch} from "../../../../hooks/useDispatch";

import {SubpagesWithTabs} from "./SubpagesWithTabs.js";
import {EntityList} from "../../../entity_lists/EntityList.js";

/* Placeholders */
const TabHeader = () => <template></template>;

// TODO: Refactor to import from single location instead.
const MEMBERS_REL_ID = "26";
const SUBCLASSES_REL_ID = "27";

export const ClassSubpage = ({entID}) => {

  const allMembersTab = JSON.stringify(
    [entID, "t:All", "members-list"]
  );

  return (
    <SubpagesWithTabs
      initTabKeys={[allMembersTab]}
      initInd={0}
    />
  );
};



export const MembersPage = ({entID}) => {
  return (
    <EntityList scaleKey={JSON.stringify([MEMBERS_REL_ID, entID])}/>
  );
};
