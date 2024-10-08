import {useState, useMemo, useContext} from "react";



/* Placeholders */
// const CategoryInstancesPage = () => <template></template>;



export const EntityPage = (props) => {
  const {entID, initTab} = props;
  const [results, setState] = useState({});

  // const [results, setResults] = useState({});
  useMemo(() => {
    // TODO: Also query for the highest rated 'representation' and if the rating
    // is high enough, use the propStruct generated from that instead.
    // TODO: Also always query for the `useful entity' meta-tag and print out
    // that rating as well. *No, just do this for the drop-down menu for now.
    
    // DataFetcher.fetchMainData(
    //   entID, (entMainData) => {
    //     setState(prev => {
    //       return {
    //         ...prev,
    //         entMainData: entMainData,
    //         isFetched: true,
    //       };
    //     });
    //   }
    // );
    setState(prev => {
      return {
        ...prev,
        isFetched: true,
      };
    });
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
        {/* <h2><EntityTitle entID={entID} isLink /></h2> */}
        {/* <div><EntityDataDisplay entID={entID} /></div> */}
      </div>
      {/* <EntitySubpages entID={entID} classID={classID} /> */}
    </div>
  );
};

