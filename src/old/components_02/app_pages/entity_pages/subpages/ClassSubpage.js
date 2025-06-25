import {useState, useMemo, useContext, useCallback} from "react";
import {useDispatch} from "../../../../hooks/useDispatch.js";

import {basicEntIDs} from "../../../../../entity_ids/basic_entity_ids.js";

import {SubpagesWithTabs} from "./SubpagesWithTabs.js";
import {EntityList} from "../../../entity_lists/EntityList.js";
import {ScaleReference} from "../../../entity_refs/EntityReference.js";
import { SetSubpage } from "./SetSubpage.js";

/* Placeholders */
// const TabHeader = () => <template></template>;


export const ClassSubpage = ({entID}) => {

  const getPageCompFromID = useCallback(tabID => {
    if (tabID == entID) {
      return [AllMembersSubpage, {entID: entID}];
    }
    return [ClassSubpage, {entID: tabID}];
  }, [entID]);

  const initTabsJSON = JSON.stringify([
    [entID, "All members"],
  ]);
  const tabScaleKeysJSON = JSON.stringify([
    [entID, basicEntIDs["relations/subclasses"]],
  ]);

  return (
    <div className="class-subpage">
      <SubpagesWithTabs
        initTabsJSON={[initTabsJSON]}
        getPageCompFromID={getPageCompFromID}
        getTabTitleFromID="Name"
        italicizeFirstTab
        tabScaleKeysJSON={tabScaleKeysJSON}
        tabBarHeader={<ScaleReference
          objID={entID} relID={basicEntIDs["relations/subclasses"]}
        />}
      />
    </div>
  );
};



export const AllMembersSubpage = ({entID}) => {
  return (
    <SetSubpage
      objID={entID} relID={basicEntIDs["relations/members"]}
      subjClassID={entID}
      lo={5}
    />
  );
};
