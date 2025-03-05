import {useState, useEffect, useMemo, useContext} from "react";
import {AccountManagerContext} from "./AccountContext.js";
import {ColumnContext} from "../hooks/ColumnContext.js";
import {useQuery, useInput} from "../hooks/DBRequests.js";

import {EntityTitle} from "../components/entity_titles/EntityTitles.js";
import {DropdownBox} from "./DropdownBox.js";
import {EntityIDDisplay} from "../../components/app_pages/entity_pages/EntityPage.js";
import {getLeaves} from "./InstListDisplay.js";
import {RatingDisplay} from "./Ratings.js";


// const EntityTitle = () => <template></template>;
// const RatingDisplay = () => <template></template>;





// TODO: Fix bug causing double inserts.

export const SubmitEntityOfTypeField = ({typeID}) => {
  const header = <>
    <h4>
      Submit an entity of the type <EntityTitle entID={typeID} isLink />
    </h4>
  </>;
  const labelArr = ["Title"];

  if (typeID == 3) {
    throw "SubmitEntityOfTypeField: [3, 4, 5, 7, 8].includes(entID)";
  }

  return (
    <SubmitEntityField entID={typeID} header={header} labelArr={labelArr}
      getDataOrRespond={(fieldValArr, setResponse) => {
        let defStr = getSingleDefStrOrRespond(fieldValArr, setResponse);
        if (defStr === null) {
          return null;
        } else {
          return {
            type: typeID,
            cxt: 0,
            defStr: defStr,
          }
        }
      }}
    />
  );
}

function getSingleDefStrOrRespond(fieldValArr, setResponse) {
  let defStr = fieldValArr[0].trim();
  // Test any input was supplied.
  if (defStr.length === 0) {
    setResponse(
      <span className="text-warning">
        No input was supplied
      </span>
    );
    return null;
  }
  
  // Test if defStr is not too long.
  // TODO: Correct this test so that it passes iff it passes in the backend.
  if (defStr.length > 255) {
    setResponse(
      <span className="text-warning">
        Defining text is too long
      </span>
    );
    console.log("Too long defining string: " + defStr);
    return null;
  }
  return defStr;
}

// Hm, I think I will actually just remove some submit tabs for non-type
// non-template entities..

export const SubmitTemplateForTypeField = ({typeID}) => {
  const header = <>
    <h4>
      Submit a template for the type <EntityTitle entID={typeID} isLink />
    </h4>
  </>;
  const labelArr = ["Template"];

  if ([1, 3, 4, 5, 7, 8].includes(typeID)) {
    throw "SubmitTemplateForTypeField: [1, 3, 4, 5, 7, 8].includes(typeID)";
  }

  return (
    <SubmitEntityField entID={typeID} header={header} labelArr={labelArr}
      getDataOrRespond={(fieldValArr, setResponse) => {
        let defStr = getSingleDefStrOrRespond(fieldValArr, setResponse);
        if (defStr === null) {
          return null;
        } else {
          return {
            type: 3,
            cxt: typeID,
            defStr: defStr,
          }
        }
      }}
    />
  );
}


export const SubmitEntityOfTemplateField = ({tmplID}) => {
  const [labelArr, setLabelArr] = useState(null); // TODO: consider useMemo.

  const [results, setResults] = useState({});
  const [reqData, ] = useState({
    req: "ent",
    id: tmplID,
  });

  useQuery(results, setResults, reqData);


  // Before results is fetched, render this:
  if (!results.isFetched) {
    return (
      <h4>
        Submit an entity of the template <EntityTitle entID={tmplID} isLink />
      </h4>
    );
  }

  // Afterwards, extract the needed data from results.data[0].
  const [tmplTypeID, tmplCxtID, tmplDefStr] = (results.data[0] ?? []);


  const header = <>
    <h4>
      Submit an entity of the template <EntityTitle entID={tmplID} isLink />
    </h4>
    <div className="tmpl-type-field">
      <b>Type: </b>
      <EntityTitle entID={tmplCxtID} isLink/>
    </div>
  </>;

  if (tmplTypeID != 3) {
    console.error({tmplID: tmplID, tmplTypeID: tmplTypeID});
    return (
      <span className="text-error">
        Entity is not a template! (This should not be happening)
      </span>
    );
  }

  if (!tmplDefStr) {
    console.warn(
      "Template #" + tmplID +
      " has been removed from the database"
    );
    return (
      <div>
        {header}
        <span className="text-warning">Template missing from the database</span>
      </div>
    );
  }

  if (!labelArr) {
    setLabelArr(getTmplLabelArr(tmplDefStr));
    return (
      <div>
        {header}
      </div>
    );
  }

  return (
    <SubmitEntityField entID={tmplID} header={header} labelArr={labelArr}
      getDataOrRespond={(fieldValArr, setResponse) => {
        let defStr = getTmplDefStrOrRespond(fieldValArr, setResponse);
        if (defStr === null) {
          return null;
        } else {
          return {
            type: tmplCxtID, // tmplCxtID is the type of derived entities.
            cxt: tmplID,
            defStr: defStr,
          }
        }
      }}
    />
  );
}


export function getTmplLabelArr(tmplDefStr) {
  let placeholderTitleArr = tmplDefStr
    // .replaceAll("&gt;", ">")
    // .replaceAll("&lt;", "<")
    .match(/<[^<>]*>/g) ?? [];
  return placeholderTitleArr.map(val => val.slice(1, -1));
}

function getTmplDefStrOrRespond(fieldValArr, setResponse) {
  let trimmedFieldValArr = fieldValArr.map(val => val.trim());
  // Test any input was supplied.
  if (trimmedFieldValArr.join().length === 0) {
    setResponse(
      <span className="text-warning">
        No input was supplied
      </span>
    );
    return null;
  }

  // Construct the defining string from form fields.
  let defStr = trimmedFieldValArr
    .map(val => val
      .replaceAll("\\", "\\1")
      .replaceAll("|", "\\|")
      .replaceAll("\\1", "\\\\")
    )
    .join("|");
  
  // Test if defStr is not too long.
  if (defStr.length > 255) {
    setResponse(
      <span className="text-warning">
        Defining text is too long
      </span>
    );
    console.log("Too long defining string: " + defStr);
    return null;
  }
  return defStr;
}



export const SubmitEntityField = ({header, labelArr, getDataOrRespond}) => {
  const [fieldValArr, setFieldValArr] = useState([]);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [, columnManager] = useContext(ColumnContext);
  const accountManager = useContext(AccountManagerContext);
  const [inputResults, setInputResults] = useState({});
  const [inputReqData, setInputReqData] = useState({});
  const [queryResults, setQueryResults] = useState({});
  const [queryReqData, setQueryReqData] = useState({});

  useQuery(queryResults, setQueryResults, queryReqData);
  useInput(inputResults, setInputResults, inputReqData);


  const isLoggedIn = useMemo(() => {
    let ret = accountManager.isLoggedIn;
      if (!ret) {
        setResponse(
          <span className="text-warning">
            Log in or sign up in order to submit an entity
          </span>
        );
      }
      return ret;
  }, [accountManager]);


  // If input response has just been received, open column if insert was
  // successful, and set isSubmitting = false in any case. Also set response
  // according to exit code.
  if (isSubmitting && inputResults.isFetched) {
    setIsSubmitting(false);
    let exitCode = inputResults.data.exitCode;
    let outID = inputResults.data.outID;
    if (exitCode == 0) {
      setResponse(
        <span>
          <span className="text-success">
            Entity was successfully uploaded!
          </span>
          <div>
            New ID: #{outID}
          </div>
        </span>
      );
      columnManager.openColumn(outID);
    } else if (exitCode == 1) {
      setResponse(
        <span>
          <span className="text-info">
          Entity already exists
          </span>
          <div>
            New ID: #{outID}
          </div>
        </span>
      );
      columnManager.openColumn(outID);
    } else {
      // throw error since this should not happen.
      throw (
        "Received exitCode=" + exitCode + " from entity submission"
      );
    }
  }
  
  // If search response has just been received, open column if insert was
  // successful, and set isSearching = false in any case. Also set response
  // according to exit code.
  if (isSearching && queryResults.search.isFetched) {
    setIsSearching(false);
    let outID = queryResults.search.data[0];
    if (outID) {
      setResponse(
        <span>
          <span className="text-success">
            Entity was found!
          </span>
          <div>
            ID: #{outID}
          </div>
        </span>
      );
      columnManager.openColumn(outID);
    } else {
      setResponse(
        <span>
          <span className="text-info">
          Entity was not found
          </span>
        </span>
      );
    }
  }

  const isFetching = isSubmitting || isSearching;


  const formGroups = labelArr.map((val, ind) => (
    <div key={ind} className="form-group">
      <label>{val}</label>
      <textarea rows="1" className="form-control" value={fieldValArr[ind] ?? ""}
        onChange={(e) => {
          setFieldValArr(prev => {
            let ret = [...prev];
            ret[ind] = e.target.value;
            return ret;
          });
        }}
      ></textarea>
    </div>
  ));

  return (
    <div>
      {header}
      <form onSubmit={void(0)}>
        <div className="def-item-field-container">
          {formGroups}
        </div>
        <div className="def-item-field-container"></div>
        <span>
          <button className="btn btn-default search" disabled={isFetching}
            onClick={() => {
              // Get a valid defining string, or set an error response and get
              // null.
              let data = getDataOrRespond(fieldValArr, setResponse);
              if (data !== null) {
                // Upload the new entity.
                setQueryResults(prev => ({...prev, search: {}}));
                setIsSearching(true);
                setQueryReqData(prev => ({...prev, search: {
                  req: "entID",
                  t: data.type,
                  c: data.cxt,
                  s: data.defStr,
                }}));
                setResponse(<span>Searching...</span>);
              } else {
                setResponse(
                  <span className="text-warning">Invalid input</span>
                );
              }
            }}
          >
            Search
          </button>
          <button className="btn btn-default submit"
            // TODO: Add tooltip for disabled submit button.
            disabled={isFetching || !isLoggedIn}
            onClick={() => {
              // Get a valid defining string, or set an error response and get
              // null.
              let data = getDataOrRespond(fieldValArr, setResponse);
              if (data !== null) {
                // Upload the new entity.
                setInputResults({});
                setIsSubmitting(true);
                setInputReqData({
                  req: "ent",
                  ses: accountManager.sesIDHex,
                  u: accountManager.inputUserID,
                  r: 1,
                  t: data.type,
                  c: data.cxt,
                  s: data.defStr,
                });
                setResponse(<span>Submitting...</span>);
              } else {
                setResponse(
                  <span className="text-warning">Invalid input</span>
                );
              }
            }}
          >
            Submit
          </button>
        </span>
      </form>
      <div className="response-display">{response}</div>
    </div>
  );
};


// export var extraInputFormGroupCL = new ContentLoader(
//   "ExtraInputFormGroup",
//   /* Initial HTML template */
//   '<div class="form-group">' +
//     '<<CloseButton>>' +
//     '<label>' +
//       '<input type="text" class="label-input"></input>:' +
//     '</label>' +
//     '<textarea rows="1" class="form-control"></textarea>' +
//   '</div>',
//   sdbInterfaceCL
// );
// extraInputFormGroupCL.addCallback(function($ci, data) {
//   $ci.on("close", function() {
//     $(this).remove();
//     return false;
//   });
// });
// // TODO: Consider dropping the label.. ..or perhaps just make the colon syntax
// // standard, and then make sure that IDs can be used instead of strings after
// // the (first) colon..

// TODO: Consider adding "ExtraInputFormGroups" again..






export const SubmitInstanceOfCategoryField = ({catID}) => {
  const [fieldVal, setFieldVal] = useState("");
  const [response, setResponse] = useState("");
  const [instID, setInstID] = useState(0);
  
  return (
    <div>
      <h4>
        Submit an instance of the category <EntityTitle entID={catID} isLink />
      </h4>
      <form onSubmit={void(0)}>
        <div className="form-group">
          <label>ID #</label>
          <textarea rows="1" className="form-control" value={fieldVal}
            onChange={(e) => {
              setFieldVal(e.target.value);
            }}
          ></textarea>
        </div>
        <button className="btn btn-default submit"
          onClick={() => {
            // Get the ID from the input field.
            let input = fieldVal.trim();
            if (/^[1-9][0-9]*$/.test(input)) {
              // TODO: Add RegEx test to check that number is a BIGINT UNSIGNED.
              setInstID(input);
            } else {
              setInstID(0);
              setResponse(
                <span className="text-warning">
                  Accepts only decimal numbers (without a # in front),
                  e.g. 1234.
                </span>
              );
            }
          }}
        >
          Submit
        </button>
      </form>
    <div className="response-display">{response}</div>
    <div className="rating-for-new-inst">{
      (instID == 0) ? "" : <>
        <h5>
          Rate the new instance(s) in order to complete the submission:
        </h5>
        {/* (Without the key prop, the EntityTitle does not update.) */}
        <RatingDisplay key={instID} catKey={{catID: catID}} instID={instID} />
      </>
    }</div>
  </div>
  );
}



