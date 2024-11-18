import {useState, useMemo, useContext, useCallback} from "react";
import {useDispatch} from "../../../../hooks/useDispatch.js";

import {basicEntIDs} from "../../../../entity_ids/basic_entity_ids.js";

import {SubpagesWithTabs} from "./SubpagesWithTabs.js";
import {EntityList} from "../../../entity_lists/EntityList.js";
import {ScaleReference} from "../../../entity_refs/EntityReference.js";
import {ScaleSubpage} from "./ScaleSubpage.js";
import {DataFetcher} from "../../../../classes/DataFetcher.js";



export const SetSubpage = ({objID, relID, subjClassID, lo, hi, ElemComp}) => {
  const [results, setState] = useState({});

  useMemo(() => {
    if (!subjClassID) {
      DataFetcher.fetchPublicSmallEntity(
        relID , (datatype, defStr, len, creatorID, isContained) => {
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
    }
  }, []);

  const getPageCompFromID = useCallback(tabID => {
    return (
      [ScaleSubpage, {
        objID: objID, relID: relID, qualID: tabID,
        showSubQualities: tabID !== basicEntIDs["qualities/relevant"],
        subjClassID: subjClassID, ElemComp: ElemComp,
      }]
    );
  }, [objID, relID]);

  // Before results is fetched, render this:
  if (!subjClassID && !results.isFetched) {
    return (
      <></>
    );
  }

  try {
    subjClassID = subjClassID ||
      JSON.parse(results.defStr)["Subject class"].substring(1);
  } catch (error) {
    return (
      <span>Subject class is missing.</span>
    );
  }

  // TODO: Compute default hi and lo as well, if not provided.


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

