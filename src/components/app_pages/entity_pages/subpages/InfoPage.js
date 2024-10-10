import {useState, useMemo, useContext} from "react";

import {DataFetcher} from "../../../classes/DataFetcher";

/* Placeholders */
// const CategoryInstancesPage = () => <template></template>;



export const InfoPage = ({entID}) => {
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

  var content;
  if (datatype === 'x') {
    content = <>
      <h1>Text content</h1>
      <XMLText xml={defStr}/>
    </>;
  }
  else if (datatype === 'j') {
    content = <JSONEntityInfoPageContent
      entID={entID} defStr={defStr} isContained={isContained}
    />;
  }
  else {
    content = <>{
      "Entity with datatype identifier '" + datatype +
      "' is not implemented yet."
    }</>;
  }

  return (
    <div className="info-page">
      {content}
    </div>
  );
};




const JSONEntityInfoPageContent = ({entID, defStr, isContained}) => {
  if (!isContained) {
    return (
      <>{"Invalid Entity #" + entID + " (definition is too long)"}</>
    );
  }
  var def;
  try {
    def = JSON.parse(defStr);
  } catch (error) {
    return (
      <>{"Invalid Entity #" + entID + " (invalid JSON)"}</>
    );
  }

  if (Array.isArray(def)) {
    return (
      <>{"Array #" + entID + " (arrays are not yet implemented)"}</>
    );
  }
  // ....
  else if (def && typeof def === "object") {
    return (
      <div className="json-entity">
        <ObjectEntityReference entID={entID} defObj={def} />
      </div>
    );
  }
  else if (typeof def === "string") {
    return (
      <div className="json-entity">
        {"String #" + entID + " (strings are not yet implemented)"}
      </div>
    );
  }
  else if (typeof def === "number") {
    return (
      <div className="json-entity">
        {def}
      </div>
    );
  }
};