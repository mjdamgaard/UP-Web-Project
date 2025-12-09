
import {post} from 'query';
import {substring} from 'string';
import {fetchEntityDefinition} from "/1/1/entities.js";

import * as InputText from 'InputText.jsx';
import * as TextArea from 'TextArea.jsx';
import * as EntityReference from "./misc/EntityReference.jsx";


export function render({}) {
  let userEntID = this.subscribeToContext("userEntID");
  let {
    entDef, isFetching, isEditingTag, isEditingBio, tagResponse, bioResponse,
  } = this.state;

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
      <h4><EntityReference key="er" entKey={userEntID} /></h4>
      <button onClick={() => this.do("editTag")}>{"Edit"}</button>
      {!isEditingTag ? undefined :
        <div className="tag-edit-field">
          <InputText key="i-tag" value={entDef["Name"]} size={10} />
          <button onClick={() => this.do("submitTag")}>{"Submit"}</button>
          <div className="tag-response-text">{tagResponse}</div>
        </div>
      }
    </div>
    <div className="bio">
      <h3>{"Bio"}</h3>
      {entDef["Bio"]}
    </div>
    <button onClick={() => this.do("editBio")}>{"Edit"}</button>
    {!isEditingBio ? undefined :
      <div className="tag-edit-field">
        <TextArea key="i-bio" value={entDef["Bio"]} />
        <button onClick={() => this.do("submitBio")}>{"Submit"}</button>
        <div className="bio-response-text">{bioResponse}</div>
      </div>
    }
  </div>;
}


export const actions = {
  "editTag": function() {
    this.setState(state => ({...state, isEditingTag: true}));
  },
  "editBio": function() {
    this.setState(state => ({...state, isEditingBio: true}));
  },
  "submitTag": function() {
    let newTag = this.call("i-tag", "getValue");
    if (!newTag) {
      this.setState(state => ({
        ...state, tagResponse: "Write a new user tag before submitting."
      }));
    }
    else if (substring(newTag, 0, 5) === "User ") {
      this.setState(state => ({
        ...state, tagResponse: 'User tag cannot start with "User ".'
      }));
    }
    else {
      post(
        "/1/1/users/profiles.sm.js./callSMF/requestNewUserTag", newTag
      ).then(wasChanged => {
        if (wasChanged) {
          this.setState(state => ({
            ...state, tagResponse: 'User tag was successfully changed!'
          }));
        }
        else {
          this.setState(state => ({
            ...state, tagResponse: 'User tag is already taken by another user.'
          }));
        }
      });
    }
  },
  "submitBio": function() {
    let newBio = this.call("i-bio", "getValue");
    post(
      "/1/1/users/profiles.sm.js./callSMF/putUserBio", newBio
    ).then(wasChanged => {
      if (wasChanged) {
        this.setState(state => ({
          ...state, bioResponse: 'User bio was successfully changed!'
        }));
      }
      else {
        this.setState(state => ({
          ...state, bioResponse: 'Something went wrong.'
        }));
      }
    });
  },
};



export const styleSheetPaths = [];
