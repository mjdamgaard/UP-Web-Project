import {useMemo, useContext} from "react";
import {
  useStateAndReducers, useDispatch
} from "../../contexts_and_hooks/useStateAndReducers.js"

import {DataFetcher} from "../../classes/DataFetcher.js";




/* Placeholders */
// const SubmitEntityField = () => <template></template>;
// const CategoryInstancesPage = () => <template></template>;



export const MetadataDisplay = (props) => {
  const {entID} = props;
  const [results, dispatch, passData] = useStateAndReducers({}, props, {});

  // const [results, setResults] = useState({});
  useMemo(() => {
    DataFetcher.fetchExpandedMetadata(
      entID, (expEntMetadata) => {
        dispatch("self", "setState", prev => {
          let ret = {...prev};
          ret.expEntMetadata = expEntMetadata;
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

  const metadata = results.expEntMetadata;

  return passData(
    <div className="metadata-display">
      <div className="class-display">
        <div>main class:</div>
        <div>{metadata.classID}</div>
      </div>
      <div className="comb-def-props">
        <div>Defining properties:</div>
        <div>{JSON.stringify(metadata.propStruct)}</div>
      </div>
    </div>
  );
};