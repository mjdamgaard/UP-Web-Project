
import {slice} from 'string';
import {fetchEntityDefinition, fetchEntityPath} from "/1/1/entities.js";

import * as ClassPage from "./entity_pages/ClassPage.jsx";

const classesClass = "/1/1/em1.js;get/classes";
const derivedClassesClass = "/1/1/em1.js;get/derivedClasses";
const componentsClass = "/1/1/em1.js;get/components";
const appsClass = "/1/1/em3.js;get/apps";
const featuresClass = "/1/1/em3.js;get/features";



export function initialize({entID}) {
  fetchEntityDefinition(entID, ["Class", "Name", "Quality"]).then(entDef => {
    let classKey = entDef["Class"];
    fetchEntityPath(classKey).then(classPath => {
      let qualProp = entDef["Quality"];
      this.setState(state => ({
        ...state, classPath: classPath, name: entDef["Name"],
        qualID: qualProp ? slice(qualProp, 2, -1) : undefined,
      }));
    });
  });

  return {};
}

export function render({entID}) {
  let {classPath, name, qualID} = this.state;
  if (classPath === undefined) {
    return <div className="entity-page fetching">{"..."}</div>;
  }

  // Branch according the the class of the entity.
  let PageComponent, extraProps = {};
  switch(classPath) {
    case classesClass:
      PageComponent = ClassPage;
      break;
    case derivedClassesClass:
      PageComponent = ClassPage;
      extraProps = {qualKey: qualID};
      break;
    // TODO: Continue.
    default:
      throw "EntityPage: Unrecognized class";
  }

  return <div className="entity-page">
    <PageComponent key={entID} entID={entID} name={name} {...extraProps} />
  </div>;
}


export const actions = {

};
