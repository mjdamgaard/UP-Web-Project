
import {fetchEntityDefinition, fetchEntityPath} from "/1/1/entities.js";
import {verifyTypes} from 'type';


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

  // TODO: Branch depending on the classPath in order to choose the page
  // component.
  let PageComponent = "...";

  return <div className="entity-page">
    <PageComponent key="0" entID={entID} title={name} />
  </div>;
}


export const actions = {

};
