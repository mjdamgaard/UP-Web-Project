import {useMemo, useContext} from "react";
import {useDispatch} from "../../contexts_and_hooks/useDispatch.js"

import {DataFetcher} from "../../classes/DataFetcher.js";




/* Placeholders */
// const SubmitEntityField = () => <template></template>;
// const CategoryInstancesPage = () => <template></template>;



export const EntityDataDisplay = (props) => {
  return <></>;
  const {entID} = props;
  const [results, dispatch, passData] = useDispatch({}, props, {});

  // const [results, setResults] = useState({});
  useMemo(() => {
    DataFetcher.fetchExpandedMainData(
      entID, (expEntMainData) => {
        dispatch("self", "setState", prev => {
          let ret = {...prev};
          ret.expEntMainData = expEntMainData;
          ret.isFetched = true;
          return ret;
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

  return passData(
    <div className="mainData-display">
      <div className="class-display">
        <div>main class:</div>
        <div>{mainData.classID}</div>
      </div>
      <div className="comb-def-props">
        <div>Defining properties:</div>
        <div>{JSON.stringify(mainData.propStruct)}</div>
      </div>
    </div>
  );
};