import {useState, createContext, useContext, useEffect} from "react";
// import {redirect} from "react-router-dom";
import {useQuery} from "../hooks/DBRequests.js";
import {ColumnContext} from "../contexts/ColumnContext.js";
import {DataFetcher} from "../classes/DataFetcher.js";
import {ExpandableSpan} from "./DropdownBox.js";

import {ParallelCallbackHandler} from "../classes/ParallelCallbackHandler.js";

const ConcatenatedEntityTitle = () => <template></template>;
const TemplateLink = () => <template></template>;
const SpecialRefEntityTitle = () => <template></template>;
// const EntityBackRefLink = () => <template></template>;
// const InvalidEntityTitle = () => <template></template>;


export const EntityTitle = ({
  entID, expectedClassID, maxRecLevel, recLevel
}) => {
  recLevel ??= 0;
  maxRecLevel ??= 2;

  const [results, setResults] = useState({});
  useEffect(() => {
    // TODO: Also query for the highest rated 'representation' and if the rating
    // is high enough, use the propStruct generated from that instead.
    // TODO: Also always query for the `useful entity' meta-tag and print out
    // that rating as well. *No, just do this for the drop-down menu for now.
    DataFetcher.fetchExpandedMetadata(
      entID, maxRecLevel, recLevel, (expEntMetadata) => {
        setResults(prev => {
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
      <EntityTitlePlaceholder entID={entID} />
    );
  }

  // Finally render this.
  const expEntMetadata = results.expEntMetadata;
  return (
    <div className="entity-title">
      <EntityReference
        expEntMetadata={expEntMetadata} expectedClassID={expectedClassID}
      />
      <ExpandTitleButton expEntMetadata={expEntMetadata} />
    </div>
  );
};



const EntityReference = ({expEntMetadata, expectedClassID}) => {
  if (expEntMetadata.entID) {
    if (expEntMetadata.isMissing) {
      return (
        <MissingEntityReference entID={expEntMetadata.entID} />
      );
    }
    return (
      <div className="entity-ref">
        <EntityLink entID={expEntMetadata.entID} >
          <EntityMetadataProperties expEntMetadata={expEntMetadata} />
          <ClassClarification
            classID={expEntMetadata.classID} expectedClassID={expectedClassID}
          />
        </EntityLink>
      </div>
    );
  }

  else if (expEntMetadata.ent) {
    let newMetadata = expEntMetadata.ent;
    return (
      <div className="entity-ref">
        <EntityLink entID={newMetadata.entID} >
          <EntityMetadataProperties expEntMetadata={newMetadata} />
          <ClassClarification expEntMetadata={newMetadata} />
        </EntityLink>
      </div>
    );
  }

  else if (expEntMetadata.thisEnt) {
    // TODO: Make.
  }
  // TODO: Continue for all other options, except string and set..
};


const EntityMetadataProperties = ({expEntMetadata}) => {
  let propStruct = expEntMetadata.propStruct;
  if (!propStruct) {
    return (
      <EntityID entID={expEntMetadata.entID} />
    );
  }

  return Object.keys(propStruct).map((propKey => {
    let propVal = propStruct[propKey];
    let propValArr = (propVal.set) ? propVal.set : [propVal];
    let propName = propKey.replaceAll(/[ \t\n\r\f]/g, "-");
    return (
      <div key={propKey} className={"prop-member-" + propName}>
        <div key={propKey} className={"prop-name-" + propName}>
          {propKey + ": "}
        </div>
        {propValArr.map((val, ind) => {
          return (
            <EntityPropertyValue key={ind} propVal={val}/>
          );
        })}
      </div>
    );
  }));
};


const EntityPropertyValue = ({propVal}) => {
  if (propVal.ent) {
    let expEntMetadata = propVal.ent;
    return (
      <div className={"prop-val-ent-" + expEntMetadata.entID}>
        <EntityReference expEntMetadata={expEntMetadata} />
      </div>
    );
  }
  else if (propVal.string) {
    return (
      <div className={"prop-val-str"}>
        {propVal.string.map((val, ind) => {
          if (typeof val === "string") {
            return (
              <div key={ind} className="pure-string">
                {val}
              </div>
            );
          }
          else if (val.ent || val.entOfClass) {
            return (
              <EntityLink key={ind} entID={propVal.ent.entID} >
                <EntityPropertyValue propVal={val} />
              </EntityLink>
            );
          }
          else throw (
            "EntityPropertyValue: val " + JSON.stringify(val) +
            " is not a string."
          );
        })}
      </div>
    );
  }
  else if (propVal.set) {
    return (
      <div className={"prop-val-set"}>
        {/* Implement sets for EntityTitle only if it becomes useful. */}
      </div>
    );
  }
  else if (propVal.list) {
    return (
      <div className={"prop-val-list"}>
        {/* Implement lists for EntityTitle only if it becomes useful. */}
      </div>
    );
  }
  else if (propVal.null) {
    return (
      <div className={"prop-val-null"}>
        {"null"}
      </div>
    );
  }
  else if (propVal.thisEnt) {
    return (
      <div className={"prop-val-this"}>
        <EntityLink entID={propVal.thisEnt}>
          {"@this"}
        </EntityLink>
      </div>
    );
  }
  else {
    throw "EntityPropertyValue: Unknown type " + JSON.stringify(propVal) + ".";
  }
};



const ClassClarification = ({expEntMetadata}) => {
  if (!expEntMetadata.propStruct || !expEntMetadata.propStruct.class) {
    return <></>;
  }
  if (!expEntMetadata.expectedClassID) {
    return (
      <div className="class-clarification">
        {/* Oh, no, I need to fetch data for 'c123' suffixes as well, then.. */}
        <EntityReference />
      </div>
    );
  }

  const classData = expEntMetadata.propStruct.class;
  if (classData.ent) {
    if (classData.ent.entID === classID) {
      return (
        <div className="class-clarification">
          
        </div>
      );
    }
  }
  if (!classData.ent && !classData.entOfClass) {
    return <></>;
  }

};




const ExpandTitleButton = ({expEntMetadata}) => {
  // TODO: Make this button turn into a whole drop-down menu when expanded.
  return (
    <div className={"expand-title-button not-expanded"}>
      {/* Implement further */}
    </div>
  );
};










const EntityTitlePlaceholder = ({entID, isLink}) => {
  return <div className="entity-title entity-title-placeholder"></div>;
}


const InvalidEntityTitle = ({entID, isLink, children}) => {
  if (isLink) {
    return (
      <div className="entity-title invalid-entity-title text-warning">
        {/* TODO: Remove "text-warning" className. */}
        <EntityLink entID={entID}>
          {children}
        </EntityLink>
      </div>
    );
  } else {
    return (
      <div className="entity-title invalid-entity-title text-warning">
        {/* TODO: Remove "text-warning" className. */}
        {children}
      </div>
    );
  }
};


const MissingEntityReference = ({entID}) => {
  // TODO: At some point in the future, potentially provide a link to some
  // archive.
  return <div className="missing-entity-ref">{"@" + entID}</div>;
}




// TODO: Change to a Link instead and let SDBInterface open the new column.
const EntityLink = ({entID, children}) => {
  const [, columnManager] = useContext(ColumnContext);

  return (
    <div className="entity-link" onClick={() => {
      columnManager.openColumn(entID);
    }}>
      {children}
    </div>
  );
};

export const EntityID = ({entID}) => {
  return (
    <EntityLink entID={entID}>
      <div className="entity-id">@{entID}</div>
    </EntityLink>
  );
};











// function transformDef(def) {
//   return def
//     .replaceAll("\\\\", "\\\\0")
//     .replaceAll("\\|", "\\\\1")
//     .replaceAll("\\@", "\\\\2")
//     .replaceAll("\\#", "\\\\3")
//     .replaceAll("\\%", "\\\\4");
// }

// function transformDefBack(transDef) {
//   return transDef
//     .replaceAll("\\\\4", "\\%")
//     .replaceAll("\\\\3", "\\#")
//     .replaceAll("\\\\2", "\\@")
//     .replaceAll("\\\\1", "\\|")
//     .replaceAll("\\\\0", "\\\\");
// }

// function getWYSIWYGDef(transDef) {
//   return transDef
//     .replaceAll("\\\\4", "%")
//     .replaceAll("\\\\3", "#")
//     .replaceAll("\\\\2", "@")
//     .replaceAll("\\\\1", "|")
//     .replaceAll("\\\\0", "\\");
// }




export const ContextDisplay = ({entID}) => {
  const [results, setResults] = useState([]);
  useQuery(results, setResults, {
    req: "ent",
    id: entID,
  });
  
  // Before results is fetched, render this:
  if (!results.isFetched) {
    return (
      <></>
    );
  }
  
  // Afterwards, first extract the needed data from results[0].
  const [typeID, cxtID, defStr] = (results.data[0] ?? []);
  
  // If the type can have no context, return an empty context display.
  if (typeID == 1 || 4 <= typeID && typeID <= 8) {
    return (
      <></>
    );
  }

  // Else set the appropriate label and append the EntityTitle of context.
  let label;
  if (typeID == 3) {
    label = 'Type of derived entities: ';
  } else {
    label = 'Template: ';
  }
  if (cxtID) {
    return (
      <span>
        {label}
        <EntityTitle entID={cxtID} isLink={true}/>
      </span>
    );
  } else {
    return (
      <span>
        {label}
        <i>none</i>
      </span>
    );
  }
};
