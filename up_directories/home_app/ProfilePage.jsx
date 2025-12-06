
import {fetchEntityDefinition} from "/1/1/entities.js";

import * as EntityReference from "./misc/EntityReference.jsx";


export function render({}) {
  let userEntID = this.subscribeToContext("userEntID");
  let {entDef, isFetching} = this.state;

  if (!isFetching && userEntID !== undefined) {
    this.setState(state => ({...state, isFetching: true}));
    fetchEntityDefinition(userEntID, ["Name", "Bio"]).then(entDef => {
      this.setState(state => ({...state, entDef: entDef ?? false}));
    });
    return <div className="profile-page fetching">{"..."}</div>;
  }

  else if (entDef === undefined) {
    return <div className="profile-page fetching">{"..."}</div>;
  }

  else if (!entDef) {
    return <div className="profile-page missing">{"missing"}</div>;
  }
  
  
  return <div className="content-page">
    <h1>{"User profile"}</h1>
    <div className="user-tag">
      <h3>{"User tag"}</h3>
      <EntityReference key="er" entKey={userEntID} />
    </div>
    <div className="bio">
      <h3>{"Bio"}</h3>
      {entDef["Bio"]}
    </div>
  </div>;

}
