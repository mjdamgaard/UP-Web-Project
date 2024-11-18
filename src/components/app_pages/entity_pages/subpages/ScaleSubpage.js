import {useState, useMemo, useContext, useCallback} from "react";
import {useDispatch} from "../../../../hooks/useDispatch.js";

import {basicEntIDs} from "../../../../entity_ids/basic_entity_ids.js";

import {SubpagesWithTabs} from "./SubpagesWithTabs.js";
import {EntityList} from "../../../entity_lists/EntityList.js";
import {ScaleReference} from "../../../entity_refs/EntityReference.js";



export const RelationSubpage = ({objID, relID}) => {

  const getPageCompFromID = useCallback(tabID => {
    return (
      [EntityList, {scaleKeyJSON: JSON.stringify([objID, tabID]), lo: 5}]
    );
  }, [objID, relID]);

  const initTabsJSON = JSON.stringify([
    [relID, undefined],
  ]);
  const tabScaleKeysJSON = JSON.stringify([
    [relID, basicEntIDs["relations/sub-relations"]],
  ]);

  return (
    <div className="relation-subpage">
      <SubpagesWithTabs
        initTabsJSON={[initTabsJSON]}
        getPageCompFromID={getPageCompFromID}
        getTabTitleFromID="Title"
        tabScaleKeysJSON={tabScaleKeysJSON}
        tabBarHeader={<ScaleReference
          objID={relID} relID={basicEntIDs["relations/sub-relations"]}
        />}
      />
    </div>
  );
};

