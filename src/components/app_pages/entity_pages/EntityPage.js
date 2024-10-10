import {useState, useMemo, useContext} from "react";

import {DataFetcher} from "../../../classes/DataFetcher";
import {EntityReference} from "../../entity_refs/EntityReference";

/* Placeholders */
// const CategoryInstancesPage = () => <template></template>;



export const EntityPage = (props) => {
  const {entID, initTab} = props;
  const [results, setState] = useState({});

  useMemo(() => {
    // TODO: Also query for the highest rated 'representation' and if the
    // score is high enough, use the entity data from that instead.
    
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
      <div className="entity-page-header">
        <h2><EntityReference entID={entID} isLink /></h2>
        {/* <div><EntityDataDisplay entID={entID} /></div> */}
      </div>
      {/* <EntitySubpages entID={entID} classID={classID} /> */}
      {"defStr: " + results.defStr}
    </div>
  );
};

