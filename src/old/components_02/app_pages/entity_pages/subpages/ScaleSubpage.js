import {useState, useMemo, useContext, useCallback} from "react";
import {useDispatch} from "../../../../hooks/useDispatch.js";

import {basicEntIDs} from "../../../../../entity_ids/basic_entity_ids.js";

import {SubpagesWithTabs} from "./SubpagesWithTabs.js";
import {EntityListSubpage} from "../../../entity_lists/EntityList.js";
import {ScaleReference} from "../../../entity_refs/EntityReference.js";



export const ScaleSubpage = ({
  objID, relID, qualID, showSubQualities, subjClassID, ElemComp
}) => {

  const getPageCompFromID = useCallback(tabID => {
    if (tabID == qualID) {
      return (
        [EntityListSubpage, {
          objID: objID, relID: relID, qualID: tabID,
          subjClassID: subjClassID, ElemComp: ElemComp,
        }]
      );
    }
    return (
      [ScaleSubpage, {
        objID: objID, relID: relID, qualID: tabID,
        showSubQualities: tabID != qualID,
        subjClassID: subjClassID, ElemComp: ElemComp,
      }]
    );
  }, [objID, relID, qualID]);

  const initTabsJSON = JSON.stringify([
    [qualID, undefined, "i"],
  ]);
  const tabScaleKeysJSON = JSON.stringify([
    [qualID, basicEntIDs["relations/sub-qualities"]],
  ]);

  if (showSubQualities) {
    return (
      <div className="scale-subpage">
        <SubpagesWithTabs
          initTabsJSON={[initTabsJSON]}
          getPageCompFromID={getPageCompFromID}
          getTabTitleFromID="Label"
          tabScaleKeysJSON={tabScaleKeysJSON}
          tabBarHeader={<ScaleReference
            objID={qualID} relID={basicEntIDs["relations/sub-qualities"]}
          />}
        />
      </div>
    );
  }
  else {
    return (
      <div className="scale-subpage">
        <EntityListSubpage
          objID={objID} relID={relID} qualID={qualID}
          subjClassID={subjClassID} ElemComp={ElemComp}
        />
      </div>
    );
  }
};

