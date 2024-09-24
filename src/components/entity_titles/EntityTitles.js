import {useState, createContext, useContext, useEffect, useMemo} from "react";
import {
  useStateAndReducers, useDispatch
} from "../../contexts_and_hooks/useStateAndReducers.js"
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
  const [results, dispatch, passData] = useStateAndReducers({}, props, {});

  // const [results, setResults] = useState({});
  useMemo(() => {
    // TODO: Also query for the highest rated 'representation' and if the rating
    // is high enough, use the mainProps generated from that instead.
    // TODO: Also always query for the `useful entity' meta-tag and print out
    // that rating as well. *No, just do this for the drop-down menu for now.
    DataFetcher.fetchExpandedMainData(
      entID, maxRecLevel, recLevel, (expEntMainData) => {
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
    return passData(
      <EntityTitlePlaceholder entID={entID} />
    );
  }

  // Finally render this.
  const expEntMainData = results.expEntMainData;
  return passData(
    <div className="entity-title">
      <EntityLink entID={expEntMainData.entID} >
        <EntityReference
          expEntMainData={expEntMainData} expectedClassID={expectedClassID}
        />
        <ExpandTitleButton expEntMainData={expEntMainData} />
      </EntityLink>
    </div>
  );
};



const EntityReference = (props) => {
  const {expEntMainData, expectedClassID} = props;
  const [results, dispatch, passData] = useStateAndReducers({}, props, {});

  if (expEntMainData.entID) {
    if (expEntMainData.isMissing) {
      return passData(
        <MissingEntityReference entID={expEntMainData.entID} />
      );
    }
    else {
      return passData(
        <div className={"entity-ref-" + expEntMainData.entID}>
          <EntityMainDataProperties expEntMainData={expEntMainData} />
          <ClassClarification
            classMainData={expEntMainData.classMainData}
            expectedClassID={expectedClassID}
          />
        </div>
      );
    }
  }

  else {
    throw (
      "EntityReference: Unhandled case: " + JSON.stringify(expEntMainData) +
      "."
    );
  }
};




const EntityMainDataProperties = ({expEntMainData}) => {
  let mainProps = expEntMainData.mainProps;
  if (!mainProps) {
    return (
      <EntityID entID={expEntMainData.entID} />
    );
  }

  return Object.keys(mainProps).map((propKey => {
    let propVal = mainProps[propKey];
    let propName = propKey.replaceAll(/[ \t\n\r\f]/g, "-");
    return (
      <div key={propKey} className={"prop-member-" + propName}>
        <div key={propKey} className={"prop-name-" + propName}>
          {propKey + ": "}
        </div>
        <EntityPropertyValue propVal={propVal} />
      </div>
    );
  }));
};




const EntityPropertyValue = (props) => {
  const {propVal} = props;
  const [results, dispatch, passData] = useStateAndReducers({}, props, {});
  
  if (typeof propVal === "string") {
    return (
      <div className="pure-string">
        {propVal}
      </div>
    );
  }

  else if (propVal.ent) {
    let newMainData = propVal.ent;
    return passData(
      <div className={"entity-ref-" + newMainData.entID}>
        <EntityMainDataProperties expEntMainData={newMainData} />
        <ClassClarification
          classMainData={newMainData.classMainData}
          expectedClassID={false}
        />
      </div>
    );
  }
  else if (propVal.classContext) {
    let expectedClassID = propVal.classContext.classID;
    let newMainData = propVal.classContext.value;
    return passData(
      <div className={"entity-ref-" + newMainData.entID}>
        <EntityMainDataProperties expEntMainData={newMainData} />
        <ClassClarification
          classMainData={newMainData.classMainData}
          expectedClassID={expectedClassID}
        />
      </div>
    );
  }

  else if (propVal.thisEnt) {
    return passData(
      <div className={"entity-ref-this-" + propVal.thisEnt}>
        {"@this"}
      </div>
    );
  }

  else if (propVal.null) {
    return passData(
      <NullEntityReference />
    );
  }
  else if (propVal.none) {
    return passData(
      <NoneEntityReference />
    );
  }

  else if (propVal.list) {
    // Implement lists further for EntityTitle only if it becomes useful.
    return passData(
      <div className="entity-ref-list">
          {JSON.stringify(propVal.list)}
      </div>
    );
  }
  else if (propVal.concat) {
    // Implement concatenations further for EntityTitle only if it becomes
    // useful.
    return passData(
      <div className="entity-ref-concat">
          {JSON.stringify(propVal.concat)}
      </div>
    );
  }

  else if (propVal.string) {
    return passData(
      propVal.string.map((val, ind) => {
        return passData(
          <EntityPropertyValue key={ind} propVal={val} />
        );
      })
    );
  }

  else {
    throw (
      "EntityPropertyValue: Unhandled case: " + JSON.stringify(propVal) +
      "."
    );
  }
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
//     let expEntMainData = propVal.ent;
//     return (
//       <div className={"prop-val-ent-" + expEntMainData.entID}>
//         <EntityReference expEntMainData={expEntMainData} />
//       </div>
//     );
//   }
//   else if (propVal.entOfClass) {
//     let expEntMainData = propVal.entOfClass;
//     return (
//       <div className={"prop-val-ent-" + expEntMainData.entID}>
//         <EntityReference
//           expEntMainData={expEntMainData}
//           expectedClassID={expEntMainData.expectedClassID}
//         />
//       </div>
//     );
//   }
//   else {
//     return (
//       <div className={"prop-val"}>
//         <EntityReference expEntMainData={propVal} />
//       </div>
//     );
//   }
// };



const ClassClarification = ({classMainData, expectedClassID}) => {
  if (!classMainData) {
    return (
      <div className={"class-clarification-missing"}>
      </div>
    );
  }
  var className = "class-clarification";
  if (classMainData.entID == expectedClassID) {
    className = "class-clarification-expected";
  }

  return (
    <div className={className}>
      <EntityReference
        expEntMainData={classMainData}
        expectedClassID={"1"} // ID of the 'class' class entity is 1.
      />
    </div>
  );
};




const ExpandTitleButton = ({expEntMainData}) => {
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
  const [dispatch, passData] = useDispatch(props, {});
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
