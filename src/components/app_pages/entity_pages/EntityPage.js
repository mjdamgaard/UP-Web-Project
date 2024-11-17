import {useState, useMemo, useCallback} from "react";

import {basicEntIDs} from "../../../entity_ids/basic_entity_ids.js";
import {DataFetcher} from "../../../classes/DataFetcher";
import {
  EntityReference, ScaleReference
} from "../../entity_refs/EntityReference";
import {EntityInfoPage} from "./subpages/InfoPage";
import {DropdownMenu} from "../../menus/DropdownMenu";
import {SubpagesWithTabs} from "./subpages/SubpagesWithTabs";

import {EntityList} from "../../entity_lists/EntityList";
import {ClassSubpage} from "./subpages/ClassSubpage.js";
import {RelationSubpage} from "./subpages/RelationSubpage.js";

/* Placeholders */
const ScoringDisplay = () => <template></template>;
const MainMenu = () => <template></template>;
const ClassesMenu = () => <template></template>;
const FilteringPredicatesMenu = () => <template></template>;
const SortingPredicatesMenu = () => <template></template>;
const SubdivisionsMenu = () => <template></template>;
const EntityPageBody = () => <template></template>;
const OpenedTabList = () => <template></template>;
const SettingsMenu = () => <template></template>;
const SubmitEntityMenu = () => <template></template>;




export const EntityPage = ({entID, initTabID}) => {
  const [results, setState] = useState({});

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

  var classID;
  try {
    classID = JSON.parse(defStr).Class.substring(1);
  } catch (error) {
    classID = null;
  }


  const getPageCompFromID = useCallback(tabID => {
    if (tabID == basicEntIDs["relations/members"]) {
      return [ClassSubpage, {entID: entID}];
    }
    return [RelationSubpage, {objID: entID, relID: tabID}];
  }, [entID]);
 
  const initTabsJSON = JSON.stringify([
    [basicEntIDs["relations/members"], "Members"],
  ]);
  const tabScaleKeysJSON = JSON.stringify([
    [classID, basicEntIDs["relations/relations for members"]],
    [entID, basicEntIDs["relations/relations"]],
  ]);

  // Before results is fetched, render this:
  if (!results.isFetched) {
    return (
      <></>
    );
  }

  return (
    <div className="entity-page">
      <EntityPageHeader entID={entID}/>
      <SubpagesWithTabs
        initTabsJSON={[initTabsJSON]}
        getPageCompFromID={getPageCompFromID}
        getTabTitleFromID="Title"
        tabScaleKeysJSON={tabScaleKeysJSON}
        tabBarHeader={<ScaleReference
          objID={entID} relID={basicEntIDs["relations/relations"]}
        />}
        initTabID={initTabID}
      />
      {/* TODO: Move the InfoPage under one of the topmost tabs instead. */}
      <DropdownMenu
        title={"Info"} children={<EntityInfoPage entID={entID} />}
        startAsExpanded
      />
    </div>
  );
};


const EntityPageHeader = ({entID}) => {
  return (
    <div className="entity-page-header">
      <h2><EntityReference entID={entID} isLink /></h2>
    </div>
  );
};

