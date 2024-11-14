import {useState, useMemo, useCallback} from "react";

import {basicEntIDs} from "../../../entity_ids/basic_entity_ids.js";
import {DataFetcher} from "../../../classes/DataFetcher";
import {EntityReference} from "../../entity_refs/EntityReference";
import {EntityInfoPage} from "./subpages/InfoPage";
import {DropdownMenu} from "../../menus/DropdownMenu";
import {SubpagesWithTabs} from "./subpages/SubpagesWithTabs";

import {EntityList} from "../../entity_lists/EntityList";
import {ClassSubpage} from "./subpages/ClassSubpage.js";

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


const CLASSES_CLASS_ID = basicEntIDs["classes"];
const RELATIONS_CLASS_ID = basicEntIDs["relations"];
const SCALES_CLASS_ID = basicEntIDs["scales"];
const RELATIONS_REL_ID = basicEntIDs["relations/relations"];
const MEMBERS_REL_ID = basicEntIDs["relations/members"];
const RELEVANT_QUAL_ID = basicEntIDs["qualities/relevant"];


export const EntityPage = ({entID, initTab}) => {
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
    if (tabID == MEMBERS_REL_ID) {
      return [ClassSubpage, {entID: tabID}];
    }
    // TODO: Handle arbitrary IDs of subclasses.
  });
 
  const initTabsJSON = JSON.stringify([
    [MEMBERS_REL_ID, "Members"],
  ]);
  const tabScaleKeysJSON = JSON.stringify([
    [entID, RELATIONS_REL_ID],
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

