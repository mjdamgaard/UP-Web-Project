
import {fetchRelationalPredicatePath} from "/1/1/entities.js";

import * as EntityReference from "../utility_components/EntityReference.jsx";
import * as ComponentEntityComponent from "./ComponentEntityComponent.jsx";



export function getInitialState({classKey}) {
  return {curClassKey: classKey};
}


export function render(props) {
  let {classKey, scoreHandler} = props;
  scoreHandler = scoreHandler ?? this.subscribeToContext("scoreHandler");
  let {curClassKey, relQualPath, topEntry} = this.state;
  let content;

  // If the classKey prop has changed, reset the state.
  if (classKey !== curClassKey) {
    this.setState(getInitialState(props));
  }

  // If the relational predicate for the class has not been fetched yet, do so.
  if (relQualPath === undefined) {
    fetchRelationalPredicatePath(classKey).then(qualPath => {
      this.setState(state => ({
        ...state, relQualPath: qualPath ?? false
      }));
    });
    content = <div className="fetching">{"..."}</div>;
  }

  // And if the quality path cannot be formed, return a "missing" content
  // (which can be restyled).
  else if (!relQualPath) {
    content = <div className="missing">{"missing quality path"}</div>;
  }

  // Else if the quality path is ready, but the top entry has not yet been
  // fetched, do that.
  else if (topEntry === undefined) {
    scoreHandler.fetchTopEntry(relQualPath).then(topEntry => {
      this.setState(state => ({...state, topEntry: topEntry ?? false}));
    });
    content = <div className="fetching">{"..."}</div>;
  }

  // And if it has been fetched, but is undefined (in the case of an empty
  // list), also return "missing" content.
  else if (!topEntry) {
    content = <div className="missing">{"missing"}</div>;
  }

  // Else if the top entry is ready, expect it to be an entity of the "App
  // component" class, with a "Component path" attribute, and render this via
  // the ComponentEntityComponent.
  else {
    let [compEntID, score] = topEntry;
    // If the score is not positive, reject the top entry and behave as if the
    // list is empty.
    if (score <= 0) {
      content = <div className="missing">{"missing"}</div>;
    }
    else {
      content = <ComponentEntityComponent 
        {...props} key="0" compEntID={compEntID}
      />;
    }
  }

  // Return the content, together with an initial link to the component class
  // (which can always be hidden by the style, say, if the component already
  // contains this link), which allows users to inspect alternative components
  // for this class, and to score them and/or add new ones themselves.
  return (
    <div className="variable-component">
      <div className="class-link">
        <EntityReference key="class" entKey={classKey} />
      </div>
      {content}
    </div>
  );
}
