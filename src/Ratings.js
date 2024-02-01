import {useState, useEffect, useMemo, useContext} from "react";
import {AccountManagerContext} from "./contexts/AccountContext.js";
import {useQuery, useInput} from "./DBRequests.js";

import {EntityTitle, FullEntityTitle} from "./EntityTitles.js";


const RatingDisplayPlaceholder = () => <div>...</div>;
// const RatingDisplayPlaceholder = () => <template></template>;
// const MissingCategoryDisplay = () => <template></template>;


export const RatingElement = ({entID, instID}) => {
  return (
    <div className="rating-element">
      <RatingDisplay catKey={{catID: entID}} instID={instID} />
    </div>
  );
};


export const RatingDisplay = ({catKey, instID}) => {
  const catID = catKey.catID;
  if (catID) {
    return (
      <div>
        <div className="statement">
          {/* <EntityTitle entID={catID} isLink={true} />
          <span className="applies-to-inst">
            {" "}(applies to <EntityTitle entID={instID} isLink={true} />)
          </span> */}
          Statement:{" "}
          <EntityTitle entID={instID} isLink={true} />
          {" "}belongs to{" "}
          <EntityTitle entID={catID} isLink={true} />
        </div>
        {/* TODO: Implement QueryUserRatingDisplay. */}
        {/* <QueryUserRatingDisplay /> */}
        <InputRatingSlider catID={catID} instID={instID} />
      </div>
    );
  }

  // If catID is falsy, see if it is fetched yet, and if not, load a
  // placeholder:
  if (!catKey.isFetched) {
    return (
      <RatingDisplayPlaceholder />
    );
  }

  // If catID is fetched but still falsy, load MissingCategoryDisplay.
  return (
    <MissingCategoryDisplay catSK={catKey.catSK} />
  );
};



export const MissingCategoryDisplay = ({catSK}) => {
  const accountManager = useContext(AccountManagerContext);

  const [reqData, setReqData] = useState({});
  const [results, setResults] = useState({});
  useInput(results, setResults, reqData);

  // If user has already submitted, load the following
  if (reqData.req) {
    if (!results.isFetched) {
      return (
        <div>
          <span className="text-info">Missing category. Want to submit it?</span>
          <button className="btn btn-default submit" disabled={true}>
            Submitting
          </button>
        </div>
      );
    }
    if (results.data.exitCode == 0) {
      return (
        <div>
          <span className="text-success">Category successfully submitted!</span>
          <button className="btn btn-default submit" disabled={true}>
            Submitted
          </button>
        </div>
      );
    } else {
      return (
        <div>
          <span className="text-warning">An error occurred.</span>
          <button className="btn btn-default submit" disabled={true}>
            Submitted
          </button>
        </div>
      );
    }
  }

  // If user is logged in and has not already submitted, load the following.
  if (accountManager.isLoggedIn) {
    return (
      <div>
        <span className="text-info">Missing category. Want to submit it?</span>
        <button className="btn btn-default submit" onClick={() => {
          setReqData({
            req: "ent",
            ses: accountManager.sesIDHex,
            u: accountManager.inputUserID,
            r: 1,
            t: 2,
            c: catSK.cxtID,
            s: catSK.defStr,
          });
        }}>
          Submit
        </button>
      </div>
    );
  }

  // Else write that user needs to log in to submit:
  return (
    <div>
      <span className="text-info">Missing category. Log in to submit it.</span>
    </div>
  );
};






// ratingDisplayCL.addCallback(function($ci, data) {
//   let reqData = {
//     req: "rat",
//     u: accountManager.stdQueryUserID,
//     c: data.catID,
//     i: data.instID,
//   };
//   dbReqManager.query($ci, reqData, data, function($ci, result, data) {
//     data.queryUserRatVal = (result[0] ?? [0])[0];
//     // I'll out-comment this for now:
//     // $ci.find('.CI.QueryUserRatingDisplay').trigger("load");
//   });
// });

// export var queryUserRatingDisplayCL = new ContentLoader(
//   "QueryUserRatingDisplay",
//   /* Initial HTML template */
//   '<div>' +
//   '</div>',
//   sdbInterfaceCL
// );
// queryUserRatingDisplayCL.addCallback(function($ci, data) {
//   let ratVal = data.getFromAncestor("queryUserRatVal");
//   if (ratVal) {
//     $ci.html((ratVal / 6553.5).toFixed(1));
//   } else {
//     $ci.html("no rating");
//   }
// });




// TODO: Add response/feedback when successfully submitting.
// TODO: Insert ten starts above the rating slider that fills up with yellow
// according to the position of the slider.
export const InputRatingSlider = ({catID, instID}) => {
  const [currVal, setCurrVal] = useState(undefined);
  const [prevInputRatVal, setPrevInputRatVal] = useState(undefined);

  const accountManager = useContext(AccountManagerContext);
  const [queryResults, setQueryResults] = useState({});
  const [inputReqData, setInputReqData] = useState({});
  const [inputResults, setInputResults] = useState({});

  useQuery(queryResults, setQueryResults, {
    req: "rat",
    u: accountManager.inputUserID,
    c: catID,
    i: instID,
  });
  useInput(inputResults, setInputResults, inputReqData);

  if (!accountManager.isLoggedIn) {
    return (
      <div>
        <input type="range"
          min="0.1" max="10.0" step="0.1" value="5" disabled={true}
        />
          <div className="value-display"></div>
          <div className="button-container">
            <span className="text-warning">
              Log in or sign up in order to submit own rating.
            </span>
          </div>
        </div>
    );
  }

  // Before results is fetched, render this:
  if (!queryResults.isFetched) {
    return (
    <div>
      <input type="range"
        min="0.1" max="10.0" step="0.1" value="5" disabled={true}
      />
        <div className="value-display"></div>
        <div className="button-container">
          <button className="btn btn-default delete" disabled={true}>
            Delete
          </button>
          <button className="btn btn-default reset" disabled={true}>
            Reset
          </button>
          <button className="btn btn-default submit" disabled={true}>
            Submit
          </button>
        </div>
      </div>
    );
  }

  // Afterwards, extract the data from results.data[0], then do a full render.

  if (prevInputRatVal === undefined) {
    setPrevInputRatVal((queryResults.data[0] ?? [null])[0]);
  }
  
  let sliderVal = prevInputRatVal ?
    (prevInputRatVal / 6553.5).toFixed(1) : null
  // if (sliderVal && currVal === null) {
  //   setCurrVal(sliderVal);
  // }

  return (
    <div>
      <input type="range"
        min="0.1" max="10.0" step="0.1" value={currVal ?? sliderVal ?? 5}
        onChange={(e) => {
          setCurrVal(e.target.value);
        }}
      />
      <div className="value-display">{currVal ?? sliderVal ?? 5}</div>
      <div className="button-container">
          {/* prevInputRatVal cannot be 0 (only null or positive). */}
          <button className="btn btn-default delete" disabled={!prevInputRatVal}
            onClick={() => {
              setInputResults({});
              setInputReqData({
                req: "rat",
                ses: accountManager.sesIDHex,
                u: accountManager.inputUserID,
                c: catID,
                i: instID,
                r: 0,
                l: 0,
              });
              setPrevInputRatVal(null);
              setCurrVal(undefined);
            }}
          >
            Delete
          </button>
          {/* currVal cannot be 0 (only null or positive). */}
          <button className="btn btn-default reset" disabled={!currVal}
            onClick={() => {
              setCurrVal(undefined);
            }}
          >
            Reset
          </button>
          <button className="btn btn-default submit" disabled={!currVal}
            onClick={() => {
              let roundedRatVal = Math.max(Math.round(currVal * 25.5), 1) * 256;
              setInputResults({});
              setInputReqData({
                req: "rat",
                ses: accountManager.sesIDHex,
                u: accountManager.inputUserID,
                c: catID,
                i: instID,
                r: roundedRatVal,
                l: 0,
              });
              setPrevInputRatVal(roundedRatVal);
              setCurrVal(undefined);
            }}
          >
            Submit
          </button>
      </div>
    </div>
  );
};
// TODO: Consider adding a response when input is confirmed by the server.




// Hm, things *really* go slow now with React... I really hope that this is
// only because it isn't "compiled" yet..(!..) 