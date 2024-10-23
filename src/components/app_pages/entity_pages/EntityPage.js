import {useState, useMemo, useContext} from "react";

import {DataFetcher} from "../../../classes/DataFetcher";
import {EntityReference} from "../../entity_refs/EntityReference";
import {EntityInfoPage} from "./subpages/InfoPage";
import {DropdownMenu} from "../../menus/DropdownMenu";

/* Placeholders */
const ScoringDisplay = () => <template></template>;
const MainMenu = () => <template></template>;
const ClassesMenu = () => <template></template>;
const FilteringPredicatesMenu = () => <template></template>;
const SortingPredicatesMenu = () => <template></template>;
const SubdivisionsMenu = () => <template></template>;



export const EntityPage = ({entID, initTab} ) => {
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

  // Before results is fetched, render this:
  if (!results.isFetched) {
    return (
      <></>
    );
  }

  // TODO: Query for the topmost types for the entity (entID), and use them to
  // specify the tabs. *Or maybe look up types in fullPropStruct, or do both..

  
 

  // // Construct the tabs on the EntityPage.
  // const [tabDataArr, defaultTab] = getTabDataArrAndDefaultTab(
  //   entID, typeID, cxtID
  // );
  // initTab ??= defaultTab;

  // const classID = results.entMainData.classID;

  return (
    <div className="entity-page">
      <EntityPageHeader entID={entID}/>
      {/* TODO: Move the InfoPage under one of the topmost tabs instead. */}
      <DropdownMenu
        title={"Info"} children={<EntityInfoPage entID={entID} />}
        startAsExpanded
      />
      <MainMenu /> {/* Consists of class tabs under which are the main tabs */}
      <ScoringDisplay />
      <ClassesMenu /> {/* Superclasses and useful subclasses */}
      <FilteringPredicatesMenu />
      <SortingPredicatesMenu />
      <SubdivisionsMenu /> {/* Under here are also all scoring menus */}
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