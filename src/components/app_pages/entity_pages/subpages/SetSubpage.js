import {useState, useMemo, useContext, useCallback} from "react";
import {useDispatch} from "../../../../hooks/useDispatch.js";

import {basicEntIDs} from "../../../../entity_ids/basic_entity_ids.js";

import {SubpagesWithTabs} from "./SubpagesWithTabs.js";
import {EntityList} from "../../../entity_lists/EntityList.js";
import {ScaleReference} from "../../../entity_refs/EntityReference.js";
import {ScaleSubpage} from "./ScaleSubpage.js";



export const SetSubpage = ({objID, relID, subjClassID, ElemComp}) => {

  const getPageCompFromID = useCallback(tabID => {
    return (
      [ScaleSubpage, {
        objID: objID, relID: relID, qualID: tabID,
        showSubQualities: tabID !== basicEntIDs["qualities/relevant"],
        subjClassID: subjClassID, ElemComp: ElemComp,
      }]
    );
  }, [objID, relID]);

  const initTabsJSON = JSON.stringify([
    [basicEntIDs["qualities/relevant"], "Relevant"],
  ]);
  const tabScaleKeysJSON = JSON.stringify([
    [subjClassID, basicEntIDs["relations/qualities for members"]],
    [relID, basicEntIDs["relations/qualities"]],
  ]);

  return (
    <div className="set-subpage">
      <SubpagesWithTabs
        initTabsJSON={[initTabsJSON]}
        getPageCompFromID={getPageCompFromID}
        getTabTitleFromID="Label"
        tabScaleKeysJSON={tabScaleKeysJSON}
        tabBarHeader={<ScaleReference
          objID={relID} relID={basicEntIDs["relations/qualities"]}
        />}
      />
    </div>
  );
};

