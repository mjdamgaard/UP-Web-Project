import {useState, createContext, useContext, useEffect, useMemo} from "react";
import {
  useSessionStateless
} from "../../contexts_and_hooks/useSessionState.js";
// import {Link} from "react-router-dom";

import {useQuery} from "../../contexts_and_hooks/DBRequests.js";
import {ColumnContext} from "../../contexts_and_hooks/ColumnContext.js";
import {DataFetcher} from "../../classes/DataFetcher.js";
import {ExpandableSpan} from "../DropdownBox.js";

import {ParallelCallbackHandler} from "../../classes/ParallelCallbackHandler.js";

const ConcatenatedEntityTitle = () => <template></template>;
const TemplateLink = () => <template></template>;
const SpecialRefEntityTitle = () => <template></template>;
// const EntityBackRefLink = () => <template></template>;
// const InvalidEntityTitle = () => <template></template>;


export const EntityTitle = (props) => {
  const {entID, expectedClassID, maxRecLevel = 2, recLevel = 0} = props;
  const [passKeys, dispatch] = useSessionStateless(props, {});

  const [results, setResults] = useState({});
  useMemo(() => {
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
    return passKeys(
      <EntityTitlePlaceholder entID={entID} />
    );
  }

  // Finally render this.
  const expEntMetadata = results.expEntMetadata;
  return passKeys(
    <div className="entity-title">
      <EntityLink entID={expEntMetadata.entID} >
        <EntityReference
          expEntMetadata={expEntMetadata} expectedClassID={expectedClassID}
        />
        <ExpandTitleButton expEntMetadata={expEntMetadata} />
      </EntityLink>
    </div>
  );
};


// TODO:
const EntityReference = ({expEntMetadata, expectedClassID}) => {
  if (expEntMetadata.entID) {
    if (expEntMetadata.isMissing) {
      return (
        <MissingEntityReference entID={expEntMetadata.entID} />
      );
    }
    else {
      return (
        <div className={"entity-ref-" + expEntMetadata.entID}>
          <EntityMetadataProperties expEntMetadata={expEntMetadata} />
          <ClassClarification
            classMetaData={expEntMetadata.classMetaData}
            expectedClassID={expectedClassID}
          />
        </div>
      );
    }
  }

  else if (expEntMetadata.ent) {
    let newMetadata = expEntMetadata.ent;
    return (
      <div className={"entity-ref-" + newMetadata.entID}>
        <EntityMetadataProperties expEntMetadata={newMetadata} />
        <ClassClarification
          classMetaData={newMetadata.classMetaData}
          expectedClassID={false}
        />
      </div>
    );
  }
  else if (expEntMetadata.entOfClass) {
    let newMetadata = expEntMetadata.entOfClass;
    return (
      <div className={"entity-ref-" + newMetadata.entID}>
        <EntityMetadataProperties expEntMetadata={newMetadata} />
        <ClassClarification
          classMetaData={newMetadata.classMetaData}
          expectedClassID={newMetadata.expectedClassID}
        />
      </div>
    );
  }

  else if (expEntMetadata.thisEnt) {
    return (
      <div className={"entity-ref-this-" + expEntMetadata.thisEnt}>
        {"@this"}
      </div>
    );
  }

  else if (expEntMetadata.null) {
    return (
      <NullEntityReference />
    );
  }
  else if (expEntMetadata.none) {
    return (
      <NoneEntityReference />
    );
  }

  else if (expEntMetadata.list) {
    // Implement lists further for EntityTitle only if it becomes useful.
    return (
      <div className="entity-ref-list">
          {JSON.stringify(expEntMetadata.list)}
      </div>
    );
  }
  else if (expEntMetadata.set) {
    // Implement sets further for EntityTitle only if it becomes useful.
    return (
      <div className="entity-ref-set">
          {JSON.stringify(expEntMetadata.set)}
      </div>
    );
  }

  else if (expEntMetadata.string) {
    return expEntMetadata.string.map((val, ind) => {
      if (typeof val === "string") {
        return (
          <div key={ind} className="pure-string">
            {val}
          </div>
        );
      }
      else {
        return (
          <EntityReference key={ind} expEntMetadata={val} />
        );
      }
    });
  }
  // else if (typeof expEntMetadata === "string") {
  //   return (
  //     <div className="pure-string">
  //       {expEntMetadata}
  //     </div>
  //   );
  // }

  else {
    throw (
      "EntityReference: Unhandled case: " + JSON.stringify(expEntMetadata) +
      "."
    );
  }
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
            <EntityReference key={ind} expEntMetadata={val} />
          );
        })}
      </div>
    );
  }));
};


// const EntityPropertyValue = ({propVal}) => {
//   if (propVal.string) {
//     return (
//       <div className={"prop-val-str"}>
//         {propVal.string.map((val, ind) => {
//           if (typeof val === "string") {
//             return (
//               <div key={ind} className="pure-string">
//                 {val}
//               </div>
//             );
//           }
//           else if (val.ent || val.entOfClass) {
//             return (
//               <EntityLink key={ind} entID={propVal.ent.entID} >
//                 <EntityPropertyValue propVal={val} />
//               </EntityLink>
//             );
//           }
//           else throw (
//             "EntityPropertyValue: val " + JSON.stringify(val) +
//             " is not a string."
//           );
//         })}
//       </div>
//     );
//   }
//   else if (propVal.ent) {
//     let expEntMetadata = propVal.ent;
//     return (
//       <div className={"prop-val-ent-" + expEntMetadata.entID}>
//         <EntityReference expEntMetadata={expEntMetadata} />
//       </div>
//     );
//   }
//   else if (propVal.entOfClass) {
//     let expEntMetadata = propVal.entOfClass;
//     return (
//       <div className={"prop-val-ent-" + expEntMetadata.entID}>
//         <EntityReference
//           expEntMetadata={expEntMetadata}
//           expectedClassID={expEntMetadata.expectedClassID}
//         />
//       </div>
//     );
//   }
//   else {
//     return (
//       <div className={"prop-val"}>
//         <EntityReference expEntMetadata={propVal} />
//       </div>
//     );
//   }
// };



const ClassClarification = ({classMetaData, expectedClassID}) => {
  if (!classMetaData) {
    return (
      <div className={"class-clarification-missing"}>
      </div>
    );
  }
  var className = "class-clarification";
  if (classMetaData.entID == expectedClassID) {
    className = "class-clarification-expected";
  }

  return (
    <div className={className}>
      <EntityReference
        expEntMetadata={classMetaData}
        expectedClassID={"1"} // ID of the 'class' class entity is 1.
      />
    </div>
  );
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
  return (
    <div className="entity-title entity-title-placeholder">
      {"loading..."}
    </div>
  );
}



const MissingEntityReference = ({entID}) => {
  // TODO: At some point in the future, potentially provide a link to some
  // archive.
  return <div className="entity-ref-missing">{"@" + entID}</div>;
}

const NullEntityReference = () => {
  return <div className="entity-ref-null">{"@null"}</div>;
}

const NoneEntityReference = () => {
  return <div className="entity-ref-none">{"@none"}</div>;
}




export const EntityLink = (props) => {
  const {entID, children} = props;
  const [passKeys, dispatch] = useSessionStateless(props, {});
  // const colKey = useContext(ColumnContext);

  return (
    <div className="entity-link" onClick={() => {
      let colSPec = {entID: entID};
      dispatch("app-column", "OPEN_COLUMN", colSPec);
    }} >
      {children}
    </div>
    // <Link replace to={{
    //   pathname: "e" + entID,
    //   search: "?from=" + colKey,
    //   state: window.history.state,
    // }} >
    //   {children}
    // </Link>
  );
};

export const EntityID = ({entID}) => {
  return (
    <div className="entity-id">
      {"@" + entID}
    </div>
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
