import {useState, useEffect, useMemo, useContext} from "react";
import {AccountManagerContext} from "./contexts/AccountContext.js";
import {ColumnContext} from "./contexts/ColumnContext.js";
import {useQuery, useInput} from "./DBRequests.js";

import {EntityTitle, FullEntityTitle} from "./EntityTitles.js";
import {DropdownBox} from "./DropdownBox.js";
import {EntityIDDisplay} from "./EntityPages.js";
import {getLeaves} from "./EntListDisplay.js";
import {RatingDisplay} from "./Ratings.js";


// const EntityTitle = () => <template></template>;
// const RatingDisplay = () => <template></template>;



export const SubmitEntityOfStdTypeField = ({typeID}) => {
  return (
    <div>
      <h4>Submit an entity of the type <EntityTitle entID={typeID}/></h4>
      <form onSubmit={void(0)}>
        <div className="def-item-field-container">
          <div className="form-group">
            <label>Title</label>
            <textarea rows="1" className="form-control"></textarea>
          </div>
        </div>
        <span>
          <button className="btn btn-default search">Search</button>
          <button className="btn btn-default submit">Submit</button>
        </span>
      </form>
      <div className="response-display"></div>
    </div>
  );
};

export const SubmitTemplateField = ({typeID}) => {
  return (
    <div>
      <h4>Submit a template</h4>
      <form onSubmit={void(0)}>
        <div className="def-item-field-container">
          <div className="form-group">
            <label>Type ID #</label>
            <textarea rows="1" className="form-control"></textarea>
          </div>
          <div className="form-group">
            <label>Template</label>
            <textarea rows="1" className="form-control"></textarea>
          </div>
        </div>
        <span>
          <button className="btn btn-default search">Search</button>
          <button className="btn btn-default submit">Submit</button>
        </span>
      </form>
      <div className="response-display"></div>
    </div>
  );
};


export const SubmitTemplateForTypeField = ({typeID}) => {
  return (
    <div>
      <h4>Submit a template for the type <EntityTitle entID={typeID}/></h4>
      <form onSubmit={void(0)}>
        <div className="def-item-field-container">
          <div className="form-group">
            <label>Template</label>
            <textarea rows="1" className="form-control"></textarea>
          </div>
        </div>
        <span>
          <button className="btn btn-default search">Search</button>
          <button className="btn btn-default submit">Submit</button>
        </span>
      </form>
      <div className="response-display"></div>
    </div>
  );
};

export const SubmitInstanceOfCategoryField = ({catID}) => {
  return (
    <div>
      <h4>Submit an instance of the category <EntityTitle entID={catID}/></h4>
      <form onSubmit={void(0)}>
        <div className="def-item-field-container">
          <div className="form-group">
            <label>ID #</label>
            <textarea rows="1" className="form-control"></textarea>
          </div>
        </div>
        <span>
          <button className="btn btn-default search">Search</button>
          <button className="btn btn-default submit">Submit</button>
        </span>
      </form>
      <div className="response-display"></div>
    </div>
  );
};


export const SubmitEntityOfTemplateField = ({tmplID}) => {
  const [labelArr, setLabelArr] = useState(null); // TODO: consider useMemo.
  const [fieldValArr, setFieldValArr] = useState([]);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [, columnManager] = useContext(ColumnContext);

  const accountManager = useContext(AccountManagerContext);
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


  const isLoggedIn = accountManager.isLoggedIn
  if (!isLoggedIn) {
    setResponse(
      <span className="text-warning">
        Log in or sign up in order to submit an entity
      </span>
    );
  }


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




// // TODO: Continue refactoring: 



// //       data.newEntityType = tmplCxtID;
// //       data.newEntityCxt = data.entID;
// //       let labelArr = getLabelArr(tmplDefStr);
// //       $ci.trigger("append-input-fields", [labelArr]);
// //     });


// submitEntityFieldCL.addCallback(function($ci, data) {
//   $ci.find("button.submit").on("click", function() {
//     $(this).trigger("construct-entity");
//     $(this).trigger("submit-entity");
//     return false;
//   });
//   $ci.find("button.search").on("click", function() {
//     $(this).trigger("construct-entity");
//     $(this).trigger("search-for-entity");
//     return false;
//   });
//   $ci.on("construct-entity", function() {
//     let $this = $(this);
//     // if (!data.readyForSubmission) {
//     //   $this.children('.response-display').html(
//     //     '<span class="text-warning">' +
//     //       'Wait until the submission field is fully loaded' +
//     //     '</span>'
//     //   );
//     //   return false;
//     // }
//     let $inputFields = $this
//       .find('.def-item-field-container')
//       .children('.CI.TextAreaFormGroup');
//     // extract inputs from which to construct the defining string.
//     let defStrParts = [];
//     $inputFields.each(function() {
//       let input = ($(this).find('.form-control').val() ?? "").trim();
//       defStrParts.push(input);
//     });
//     // if entID is the "Template" type entity, let newEntityCxt be the
//     // input of the first ("Type #") input field, and let defStr be that of
//     // the following "Template" field.
//     if (data.entID == 3) {
//       data.newEntityCxt = defStrParts[0];
//       data.defStr = defStrParts[1];
//     // else construct defStr from all the input fields given by the
//     // template.
//     } else {
//       // construct the defining string.
//       data.defStr = defStrParts
//         .map(val => val.replaceAll("|", "\\|").replaceAll("\\", "\\\\"))
//         .join("|");
//       // test if defStr is not too long or too short.
//       if (data.defStr.length > 255) {
//         $this.children('.response-display').html(
//           '<span class="text-warning">' +
//             'Defining text is too long' +
//           '</span>'
//         );
//         console.log("Too long defining string: " + data.defStr);
//         return;
//       }
//       // test any input was supplied to it.
//       if (/^[\|]*$/.test(data.defStr)) {
//         $this.children('.response-display').html(
//           '<span class="text-warning">' +
//             'No input was supplied' +
//           '</span>'
//         );
//         return;
//       }
//     }
//     return false;
//   });
//   $ci.on("submit-entity", function() {
//     // upload the new entity.
//     let reqData = {
//       req: "ent",
//       ses: accountManager.sesIDHex,
//       u: accountManager.inputUserID,
//       r: 1,
//       t: data.newEntityType,
//       c: data.newEntityCxt,
//       s: data.defStr,
//     };
//     dbReqManager.input($(this), reqData, data, function($ci, result, data) {
//       let exitCode = result.exitCode;
//       let outID = result.outID;
//       let newData = new DataNode(data, {entID: outID});
//       if (exitCode == 0) {
//         $ci.children('.response-display').html(
//           '<span class="text-success">' +
//             'Entity was successfully uploaded!' +
//           '</span>' +
//           '<div>' +
//             'New ID: #' + outID +
//           '</div>'
//         );
//         $ci.trigger("open-column", ["AppColumn", newData, "right"]);
//       } else if (exitCode == 1) {
//         $ci.children('.response-display').html(
//           '<span class="text-info">' +
//             'Entity already exists' +
//           '</span>' +
//           '<div>' +
//             'ID: #' + outID +
//           '</div>'
//         );
//         $ci.trigger("open-column", ["AppColumn", newData, "right"]);
//       } else {
//         // throw error since this should not happen.
//         throw (
//           "Received exitCode=" + exitCode + " from entity submission"
//         );
//       }
//     });
//     return false;
//   });
//   $ci.on("search-for-entity", function() {
//     let $this = $(this);
//     // remove previous response text.
//     $ci.children('.response-display').empty();
//     // upload the new entity.
//     let reqData = {
//       req: "entID",
//       u: data.getFromAncestor("inputUserID"),
//       t: data.newEntityType,
//       c: data.newEntityCxt,
//       s: data.defStr,
//     };
//     dbReqManager.query($this, reqData, data, function($ci, result, data) {
//       let entID = (result[0] ?? [0])[0];
//       let newData = new DataNode(data, {entID: entID});
//       if (entID) {
//         $ci.children('.response-display').html(
//           '<span class="text-success">' +
//             'Entity was found!' +
//           '</span>' +
//           '<div>' +
//             'ID: #' + entID +
//           '</div>'
//         );
//         $ci.trigger("open-column", ["AppColumn", newData, "right"]);
//       } else {
//         $ci.children('.response-display').html(
//           '<span class="text-info">' +
//             'Entity was not found' +
//           '</span>'
//         );
//       }
//     });
//     return false;
//   });
// });


// export var textAreaFormGroupCL = new ContentLoader(
//   "TextAreaFormGroup",
//   /* Initial HTML template */
//   '<div class="form-group">' +
//     '<label></label>' +
//     '<textarea rows="1" class="form-control"></textarea>' +
//   '</div>',
//   sdbInterfaceCL
// );
// textAreaFormGroupCL.addCallback("data", function(data) {
//   data.copyFromAncestor([
//     "label",
//   ]);
// });
// textAreaFormGroupCL.addCallback(function($ci, data) {
//   $ci.find('label').append(data.label + ":");
// });

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








// export var submitInstanceFieldCL = new ContentLoader(
//   "SubmitInstanceField",
//   /* Initial HTML template */
//   '<div>' +
//     '<h4>Submit an instance of <<EntityTitle>></h4>' +
//     '<<SubmitInstanceForm>>' +
//   '</div>',
//   sdbInterfaceCL
// );
// submitInstanceFieldCL.addCallback("data", function(data) {
//   data.catID = data.getFromAncestor("entID");
// });
// export var submitInstanceFormCL = new ContentLoader(
//   "SubmitInstanceForm",
//   /* Initial HTML template */
//   '<div>' +
//     '<form onSubmit={void(0)}>' +
//       '<div class="form-group">' +
//         '<label>ID #:</label>' +
//         '<input type="text" class="form-control id"></input>' +
//       '</div>' +
//       '<button class="btn btn-default submit">Submit</button>' +
//     '</form>' +
//     '<div class="response-display"></div>' +
//   '</div>',
//   sdbInterfaceCL
// );
// submitInstanceFormCL.addCallback(function($ci, data) {
//   $ci.find('button.submit').on("click", function() {
//     $(this).trigger("submit-id");
//   });
//   $ci.on("submit-id", function() {
//     let $ci = $(this);
//     let inputVal = $ci.find('input.id').val();
//     // get the ID from the input field.
//     let id;
//     if (/^#[1-9][0-9]*$/.test(inputVal)) {
//       id = inputVal.substring(1);
//     } else if (/^[1-9][0-9]*$/.test(inputVal)) {
//       id = inputVal;
//     } else {
//       $ci.children('.response-display').html(
//         '<span class="text-warning">' +
//           'Please insert a decimal number (w/wo a # in front)' +
//         '</span>'
//       );
//       return false;
//     }
//     // generate a rating display with this ID as the instID.
//     data.instID = id;
//     data.prevInputRatVal = null;
//     if (!data.rateMsgIsAppended) {
//       $ci.append(
//         '<h5>' +
//           'Rate the new instance(s) in order to complete the ' +
//           'submission:' +
//         '</h5>'
//       );
//       data.rateMsgIsAppended = true;
//     }
//     submitInstanceFormCL.loadAfter($ci, "RatingDisplay", data);
//     return false;
//   });
// });
