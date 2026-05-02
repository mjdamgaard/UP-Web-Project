
import * as ScoreDisplay from "./ScoreDisplay.jsx";
import {fetchEntityPath, fetchEntityDefinition} from "/1/1/entities.js";

const classesClass = "/1/1/em1.js;get/classes";
const derivedClassesClass = "/1/1/em1.js;get/derivedClasses";
const appsClass = "/1/1/em3.js;get/apps";
const featuresClass = "/1/1/em3.js;get/features";
const appVersionsClass = "/1/1/em3.js;get/appVersions";
const featureVersionsClass = "/1/1/em3.js;get/featureVersions";



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


export function render({entID, qualKey, score, weight}) {
  let {classPath, name} = this.state;
  if (classPath === undefined) {
    return <div className="entity-element fetching">{"..."}</div>;
  }

  // Branch according the the class of the entity.
  let content;
  switch(classPath) {
    case classesClass:
    case derivedClassesClass:
      content = "entID: " + entID;//<EntityReference key="er" entKey={entID} />;
      break;
    // TODO: Continue.
    default:
      content = <div className="unknown-class">Unrecognized class</div>;
  }

  return <div className="entity-element">
    <div className="id-display"><span>{"#" + entID}</span></div>
    <div className="content">{(content)}</div>
    <ScoreDisplay key="s" score={score} weight={weight} qualKey={qualKey} />
  </div>;
}
