
import {fetchRelevancyQualityPath} from "/1/1/entities.js";

import * as EntityReference from "../utility_components/EntityReference.jsx";
import * as ComponentEntityComponent from "./ComponentEntityComponent.jsx";



export function render(props) {
  let {classKey, scoreHandler} = props;
  scoreHandler = scoreHandler ?? this.subscribeToContext("scoreHandler");
  let {relevancyQualPath, topEntry} = this.state;
  let content;

  // If the relevancy quality for the class has not been fetched yet, do so.
  if (relevancyQualPath === undefined) {
    fetchRelevancyQualityPath(classKey).then(qualPath => {
      this.setState({...this.state, relevancyQualPath: qualPath ?? false});
    });
    content = <div className="fetching"></div>;
  }

  // Else if the quality path is ready, but the top entry has not yet been
  // fetched, do that.
  else if (topEntry === undefined) {
    scoreHandler.fetchTopEntry(relevancyQualPath).then(topEntry => {
      this.setState({...this.state, topEntry: topEntry ?? false});
    });
    content = <div className="fetching"></div>;
  }

  // And if it has, but is undefined (in the case of an empty list), also
  // render an empty component (possibly with some ::after content).
  else if (!topEntry) {
    content = <div className="missing"></div>;
  }

  // Else if the top entry is ready, expect it to be an entity of the "App
  // component" class, with a "Component path" attribute, and render this via
  // the ComponentEntityComponent.
  else {
    let [compEntID, score] = topEntry;
    // If the score is not positive, reject the top entry and behave as if the
    // list is empty.
    if (score <= 0) {
      content = <div className="missing"></div>;
    }
    else {
      content = <ComponentEntityComponent key="0"
        {...props} compEntID={compEntID}
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
