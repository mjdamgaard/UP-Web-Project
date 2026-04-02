
import {fetchEntityDefinition, fetchEntityPath} from "/1/1/entities.js";
import {verifyTypes} from 'type';

import * as ClassPage from "./entity_pages/ClassPage.jsx";

const classesClass = "/1/1/em1.js;get/classes";
const derivedClassesClass = "/1/1/em1.js;get/derivedClasses";
const componentsClass = "/1/1/em1.js;get/components";
const appsClass = "/1/1/em3.js;get/apps";
const featuresClass = "/1/1/em3.js;get/features";



export function initialize({entID}) {
  fetchEntityDefinition(entID, ["Class", "Name"]).then(entDef => {
    let classKey = entDef["Class"];
    fetchEntityPath(classKey).then(classPath => {
      this.setState(state => ({
        ...state, classPath: classPath, name: entDef["Name"],
      }));
    });
  });

  return {};
}

export function render({entID}) {
  let {classPath, name} = this.state;
  if (classPath === undefined) {
    return <div className="entity-page fetching">{"..."}</div>;
  }

  else {
    verifyTypes([classPath, name], ["string", "string"]);
  }

  // Branch according the the class of the entity.
  let PageComponent;
  switch(classPath) {
    case classesClass:
      PageComponent = ClassPage;
      break;
    // TODO: Continue.
    default:
      throw "EntityPage: Unrecognized class";
  }

  return <div className="entity-page">
    <PageComponent key={entID} entID={entID} name={name} />
  </div>;
}


export const actions = {

};
