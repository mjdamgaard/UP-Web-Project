
import {
  fetchEntityDefinition, fetchRelationalPredicatePath,
} from "/1/1/entities.js";

// TODO: Change back to GeneralEntityPage again.
import * as GeneralEntityPage //from "../entity_pages/GeneralEntityPage.jsx";
  from "../entity_pages/ClassPage.jsx";

const entityPageRel = "/1/1/em1.js;get/entityPage";




export function getInitialState({entKey, classKey = undefined}) {
  return {classKey: classKey, curEntKey: entKey};
}


export function render(props) {
  let {entKey, scoreHandler} = props;
  scoreHandler = scoreHandler ?? this.subscribeToContext("scoreHandler");
  let {classKey, entityPageQualPath, topEntry, curEntKey} = this.state;
  let content;

  // If the entKey prop has changed, reset the state.
  if (entKey !== curEntKey) {
    this.setState(getInitialState(props));
  }

  // If the class key is not provided, and has not already been fetched, do so.
  if (classKey === undefined) {
    fetchEntityDefinition(entKey).then(entDef => {
      this.setState(state => ({...state, classKey: entDef["Class"]}));
    });
    content = <div className="fetching">{"..."}</div>;
  }

  // Else if the relational "Entity page" quality for the class has not been
  // fetched yet, do so.
  else if (entityPageQualPath === undefined) {
    fetchRelationalPredicatePath(classKey, entityPageRel).then(qualPath => {
      this.setState(state => ({
        ...state, entityPageQualPath: qualPath ?? false
      }));
    });
    content = <div className="fetching">{"..."}</div>;
  }

  // Else if the quality path is ready, but the top entry has not yet been
  // fetched, do that.
  else if (topEntry === undefined) {
    scoreHandler.fetchTopEntry(entityPageQualPath).then(topEntry => {
      this.setState(state => ({...state, topEntry: topEntry ?? false}));
    });
    content = <div className="fetching">{"..."}</div>;
  }
  
  // Else ff top entry is non-existent, or the score is non-positive, render
  // a general entity page as the default.
  if (!topEntry || topEntry[1] <= 0) {
    content = <GeneralEntityPage {...props} key="_0" />;
  }

  // Else if the top entry is ready, expect it to be an entity of the "App
  // component" class, with a "Component path" attribute, and render this via
  // the ComponentEntityComponent.
  else {console.log(topEntry);
    let [compEntID] = topEntry;
    content = <ComponentEntityComponent
      {...props} compEntID={compEntID} key="0"
    />;
  }

  // Return the content.
  return (
    <div className="entity-page-container">
      {content}
    </div>
  );
}

