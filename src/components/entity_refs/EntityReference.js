import {useState, createContext, useContext, useEffect, useMemo} from "react";
import {useDispatch} from "../../hooks/useDispatch.js"
// import {Link} from "react-router-dom";

import {DataFetcher} from "../../classes/DataFetcher.js";
// const EntityReferencePlaceholder = () => <template></template>;
// const EntityBackRefLink = () => <template></template>;
// const InvalidEntityTitle = () => <template></template>;

const CLASS_CLASS_ID = 2;


export const EntityReference = ({
  entID, isLink, maxRecLevel = 2, recLevel = 0
}) => {
  const [results, setState] = useState({});

  useMemo(() => {
    if (recLevel <= maxRecLevel) {
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
    }
  }, []);

  const {datatype, defStr, isContained, isFetched} = results;

  if (recLevel > maxRecLevel) {
    if (isLink) {
      return (
        <span className="entity-ref">
          <EntityLink entID={entID} >
            {"Entity #" + entID}
          </EntityLink>
        </span>
      );
    } else {
      return (
        <span className="entity-ref">
          {"Entity #" + entID}
        </span>
      );
    }
  }

  // Before results is fetched, render this:
  if (!isFetched) {
    return (
      <EntityReferencePlaceholder entID={entID} />
    );
  }


  var content;
  if (datatype === 'x') {
    content = "Text #" + entID;
  }
  else if (datatype === 'j') {
    content = <JSONEntityReference
      entID={entID} defStr={defStr} isContained={isContained}
    />;
  }
  else {
    content = "Entity #" + entID;
  }

  // Finally render this.
  if (isLink) {
    // TODO: Make the link a button to the left of the title instead.
    return (
      <span className="entity-ref">
        <EntityLink entID={entID} >
          {content}
        </EntityLink>
      </span>
    );
  } else {
    return (
      <span className="entity-ref">
        {content}
      </span>
    );
  }
};



const JSONEntityReference = ({entID, defStr, isContained}) => {
  if (!isContained) {
    return (
      <span className="json-entity invalid">
        {"Invalid Entity #" + entID + " (definition is too long)"}
      </span>
    );
  }
  var def;
  try {
    def = JSON.parse(defStr);
  } catch (error) {
    return (
      <span className="json-entity invalid">
        {"Invalid Entity #" + entID + " (invalid JSON)"}
      </span>
    );
  }

  if (Array.isArray(def)) {
    return (
      <span className="json-entity">
        {"Array #" + entID + " (arrays are not yet implemented)"}
      </span>
    );
  }
  else if (def && typeof def === "object") {
    return (
      <span className="json-entity">
        <ObjectEntityReference entID={entID} defObj={def} />
      </span>
    );
  }
  else if (typeof def === "string") {
    return (
      <span className="json-entity">
        {"String #" + entID + " (strings are not yet implemented)"}
      </span>
    );
  }
  else if (typeof def === "number") {
    return (
      <span className="json-entity">
        {/* {def} */}
        {"Number #" + entID + " (numbers are not yet implemented)"}
      </span>
    );
  }
};



const ObjectEntityReference = ({entID, defObj}) => {
  if (!defObj.Class) {
    return (
      <span className="obj-entity invalid">
        {"Invalid Object Entity #" + entID + " (missing class)"}
      </span>
    );
  }
  if (!/^@[1-9][0-9]*$/.test(defObj.Class)) {
    return (
      <span className="obj-entity invalid">
        {"Invalid Object Entity #" + entID + " (class is not a reference)"}
      </span>
    );
  }

  const classID = defObj.Class.match(/[0-9]+/)[0];
  var content;
  switch (classID) {
    // case CLASS_CLASS_ID:
    //   content = <ReferenceContentOfClassClass
    //     entID={entID} defObj={defObj}
    //   />;
    //   break;
    // TODO: Add more.
    default:
      content = <DefaultReferenceContent
        entID={entID} defObj={defObj}
      />;
  }

  return (
    <span className={"obj-entity class-id-" + classID}>
      {content}
    </span>
  );
};


const DefaultReferenceContent = ({entID, defObj}) => {
  return (
    <span className="class-default">
      {
        Object.entries(defObj).map(([key, val], ind) => {
          let parsedKey = key.toLowerCase().match(/[a-z0-9\-]+/g).join();
          return (
            <span key={ind} className={"member-" + parsedKey}>
              <span className="attribute-name">{key}</span>
              <span className="attribute-value">{val}</span>
            </span>
          );
        })
      }
      <span key={"entID"} className="entID">{entID}</span>
    </span>
  );
};













const ExpandTitleButton = ({expEntMainData}) => {
  // TODO: Make this button turn into a whole drop-down menu when expanded.
  return (
    <span className={"expand-title-button not-expanded"}>
      {/* Implement further */}
    </span>
  );
};







const EntityReferencePlaceholder = ({entID, isLink}) => {
  return (
    <span className="entity-title entity-title-placeholder">
      {"loading..."}
    </span>
  );
}



const MissingEntityReference = ({entID}) => {
  // TODO: At some point in the future, potentially provide a link to some
  // archive.
  return <span className="entity-ref-missing">{"@" + entID}</span>;
}

const NullEntityReference = () => {
  return <span className="entity-ref-null">{"@null"}</span>;
}

const NoneEntityReference = () => {
  return <span className="entity-ref-none">{"@none"}</span>;
}




export const EntityLink = ({entID, children}) => {
  const [refCallback, dispatch] = useDispatch();
  // const colKey = useContext(ColumnContext);

  return (
    <span className="entity-link" ref={refCallback} onClick={(e) => {
      let pagePath = "/e" + entID;
      dispatch(e.target, "OPEN_PAGE", pagePath);
    }} >
      {children}
    </span>
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
    <span className="entity-id">
      {"@" + entID}
    </span>
  );
};






export const ScaleReference = ({objID, relID}) => {
  return (
    <span className="scale-ref">
      <span className="obj-ref"><EntityReference entID={objID}/></span>
      <span className="rel-op">{"→"}</span>
      <span className="rel-ref"><EntityReference entID={relID}/></span>
    </span>
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
