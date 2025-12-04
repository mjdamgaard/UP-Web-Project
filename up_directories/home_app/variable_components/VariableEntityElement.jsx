
import {
  fetchRelationalQualityPath, fetchEntityProperty
} from "/1/1/entities.js";

import * as EntityReference from "../misc/EntityReference.jsx";
import * as GeneralEntityElement
from "../entity_elements/GeneralEntityElement.jsx";
import * as MissingEntityElement
from "../entity_elements/MissingEntityElement.jsx";
import * as ComponentEntityComponent from "./ComponentEntityComponent.jsx";

const entityElementRelPath = "/1/1/em1.js;get/entityElement";




export function render(props) {
  let {entID, scoreHandler} = props;
  scoreHandler = scoreHandler ?? this.subscribeToContext("scoreHandler");
  let {classKey, relQualPath, topEntry} = this.state;
  let content;

  // If the classKey for the entity has not been gotten yet, fetch it.
  if (classKey === undefined) {
    fetchEntityProperty(entID, "Class").then(classKey => {
      this.setState(state => ({...state, classKey: classKey ?? false}));
    });
    content = <div className="fetching">{"..."}</div>;
  }

  // TODO: Should value entities also be implemented here?
  // If the entity definition is missing, or is not a referential entity (with
  // a "Class" property) render a missing entity element.
  else if (!classKey) {
    return <MissingEntityElement {...props} key="_m" />;
  }

  // If the relational quality for the class has not been fetched yet, do so.
  else if (relQualPath === undefined) {
    fetchRelationalQualityPath(
      classKey, entityElementRelPath
    ).then(qualPath => {
      this.setState(state => ({
        ...state, relQualPath: qualPath ?? false
      }));
    });
    content = <div className="fetching">{"..."}</div>;
  }

  // Else if the quality path is ready, but the top entry has not yet been
  // fetched, do that.
  else if (topEntry === undefined) {
    scoreHandler.fetchTopEntry(relQualPath).then(topEntry => {
      this.setState(state => ({...state, topEntry: topEntry ?? false}));
    });
    content = <div className="fetching">{"..."}</div>;
  }

  // And if it has, but is undefined (in the case of an empty list), render the
  // default entity element component.
  else if (!topEntry) {
    return <GeneralEntityElement {...props} key="_0" />;
  }

  // Else if the top entry is ready, expect it to be an entity of the "App
  // component" class, with a "Component path" property, and render this via
  // the ComponentEntityComponent.
  else {
    let [compEntID, score] = topEntry;
    // If the score is not positive, reject the top entry and behave as if the
    // list is empty.
    if (score <= 0) {
      return <GeneralEntityElement {...props} key="_0" />;
    }
    content = <ComponentEntityComponent
      {...props} compEntID={compEntID} key="0"
    />;
  }

  // Return the content, together with an initial link to the component class
  // (which can always be hidden by the style, say, if the component already
  // contains this link), which allows users to inspect alternative element
  // components for this class, and to score them and/or add new ones
  // themselves.
  return (
    <div className="variable-entity-element">
      {classKey ?
        <div className="class-link">
          <EntityReference key="class" entKey={classKey} />
        </div> :
        undefined
      }
      {content}
    </div>
  );
}
