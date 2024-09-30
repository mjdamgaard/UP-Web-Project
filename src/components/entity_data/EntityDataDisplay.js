import {useMemo, useState} from "react";
import {useDispatch} from "../../contexts_and_hooks/useDispatch.js"

import {DataFetcher} from "../../classes/DataFetcher.js";

import {
  EntityTitle, EntityPropertyValue
} from "../entity_titles/EntityTitles.js";


/* Placeholders */
// const SubmitEntityField = () => <template></template>;
// const CategoryInstancesPage = () => <template></template>;



export const EntityDataDisplay = (props) => {
  const {entID} = props;
  const [results, setSate] = useState({});

  // const [results, setResults] = useState({});
  useMemo(() => {
    DataFetcher.fetchExpandedMainData(
      entID, (expEntMainData) => {
        setSate(prev => {
          return {
            ...prev,
            expEntMainData: expEntMainData,
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

  const mainData = results.expEntMainData;
console.log(mainData);
  return (
    <div className="entity-data-display">
      <div className="main-class-display">
        <div>main class</div>
        <div>
          <EntityPropertyValue propVal={{
            classContext: {classID: 1, value: mainData.classMainData}
          }} />
        </div>
      </div>
      <div className="main-props-display">
        <div>Main properties</div>
        <div>{
          Object.entries(mainData.mainProps).map(([key, val], ind) => {
            return (
              <div key={ind} className="prop-member-display">
                <div className="prop-name">{key}</div>
                <div className="prop-val">{val}</div>
              </div>
            );
          })
        }</div>
      </div>
    </div>
  );
};