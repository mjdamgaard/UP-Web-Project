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
        <div className="entity-ref">
          <EntityLink entID={entID} >
            {"Entity #" + entID}
          </EntityLink>
        </div>
      );
    } else {
      return (
        <div className="entity-ref">
          {"Entity #" + entID}
        </div>
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
      <div className="entity-ref">
        <EntityLink entID={entID} >
          {content}
        </EntityLink>
      </div>
    );
  } else {
    return (
      <div className="entity-ref">
        {content}
      </div>
    );
  }
};



const JSONEntityReference = ({entID, defStr, isContained}) => {
  if (!isContained) {
    return (
      <div className="json-entity invalid">
        {"Invalid Entity #" + entID + " (definition is too long)"}
      </div>
    );
  }
  var def;
  try {
    def = JSON.parse(defStr);
  } catch (error) {
    return (
      <div className="json-entity invalid">
        {"Invalid Entity #" + entID + " (invalid JSON)"}
      </div>
    );
  }

  if (Array.isArray(def)) {
    return (
      <div className="json-entity">
        {"Array #" + entID + " (arrays are not yet implemented)"}
      </div>
    );
  }
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
        {/* {def} */}
        {"Number #" + entID + " (numbers are not yet implemented)"}
      </div>
    );
  }
};



const ObjectEntityReference = ({entID, defObj}) => {
  if (!defObj.class) {
    return (
      <div className="obj-entity invalid">
        {"Invalid Object Entity #" + entID + " (missing class)"}
      </div>
    );
  }
  if (!/^@[1-9][0-9]*$/.test(defObj.class)) {
    return (
      <div className="obj-entity invalid">
        {"Invalid Object Entity #" + entID + " (class is not a reference)"}
      </div>
    );
  }

  const classID = defObj.class.match(/[0-9]+/)[0];
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
    <div className={"obj-entity class-id-" + classID}>
      {content}
    </div>
  );
};


const DefaultReferenceContent = ({entID, defObj}) => {
  return (
    <div className="class-default">
      {
        Object.entries(defObj).map(([key, val], ind) => {
          let parsedKey = key.match(/[a-z0-9\-]+/g).join();
          return (
            <div key={ind} className={"member-" + parsedKey}>
              <div className="attribute-name">{key}</div>
              <div className="attribute-value">{val}</div>
            </div>
          );
        })
      }
      <div key={"entID"} className="entID">{entID}</div>
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







const EntityReferencePlaceholder = ({entID, isLink}) => {
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




export const EntityLink = ({entID, children}) => {
  const [refCallback, dispatch] = useDispatch();
  // const colKey = useContext(ColumnContext);

  return (
    <div className="entity-link" ref={refCallback} onClick={(e) => {
      let pagePath = "/e" + entID;
      dispatch(e.target, "OPEN_PAGE", pagePath);
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
