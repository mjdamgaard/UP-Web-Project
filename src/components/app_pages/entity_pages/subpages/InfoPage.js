import {useState, useMemo, useContext} from "react";

import {DataFetcher} from "../../../../classes/DataFetcher";
import {DropdownMenu} from "../../../menus/DropdownMenu";
import {EntityReference} from "../../../entity_refs/EntityReference";
import {XMLText, XMLTextFromEntID} from "../../../texts/XMLText";

/* Placeholders */
// const XMLText = () => <template></template>;



export const EntityInfoPage = ({entID}) => {
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
      <XMLText xml={defStr} />
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
  else if (def && typeof def === "object") {
    return (
      <div className="json-entity">
        <ObjectEntityInfoPageContent entID={entID} defObj={def} />
      </div>
    );
  }
  else if (typeof def === "string") {
    return (
      <>{"String #" + entID + " (strings are not yet implemented)"}</>
    );
  }
  else if (typeof def === "number") {
    return (
      <>{"Number #" + entID + " (numbers are not yet implemented)"}</>
    );
  }
};



const ObjectEntityInfoPageContent = ({entID, defObj}) => {

  const attributeMembers =  Object.entries(defObj).map(([key, val], ind) => {
    let parsedKey = key.match(/[a-z0-9\-]+/g).join();
    if (/^@[1-9[0-9]*$/.test(val)) {
      val = <EntityReference entID={val.substring(1)} isLink />
    }
    return (
      <div key={ind} className={"member-" + parsedKey}>
        <div className="attribute-name">{key}</div>
        <div className="attribute-value">{val}</div>
      </div>
    );
  });

  var descriptionText;
  if (/^@[1-9][0-9]*$/.test(defObj.description)) {
    descriptionText = <XMLTextFromEntID
      entID={defObj.description.substring(1)}
    />;
  } else {
    descriptionText = "Description attribute is ill-formed or missing."
  }

  return (
    <>
      <DropdownMenu
        title={"Attributes"} children={attributeMembers} startAsExpanded
      />
      <DropdownMenu
        title={"Description"} children={descriptionText} startAsExpanded
      />
    </>
  );
};