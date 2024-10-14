import {useState, useMemo} from "react";
import {DataFetcher} from "../../classes/DataFetcher";


export const XMLTextFromEntID = ({entID}) => {
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
  else {
    return <XMLText xml={defStr} />;
  }

  
};

export const XMLText = ({xml}) => {
  return (
    <div className="xml-text">
      {parseXML(xml)}
    </div>
  );
};



function parseXML(xml) {
  // TODO: Implement.
  return xml; 
}