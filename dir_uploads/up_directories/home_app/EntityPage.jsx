
import {
  fetchEntityDefinition, fetchRelevancyQualityPath,
} from "/1/1/entities.js";

const entityPageRel = "/1/1/em1.js;get/entityPage";




export function getInitState({classKey = undefined}) {
  return {classKey: classKey};
}


export function render(props) {
  let {entKey} = props;
  let scoreHandler = this.subscribeToContext("score-handler");
  let {classKey, entityPageQualPath, topEntry} = this.state;
  let content;

  // If the class key is not provided, and has not already been fetched, do so.
  if (relevancyQualPath === undefined) {
    fetchEntityDefinition(entKey).then(entDef => {
      this.setState({...this.state, classKey: entDef["Class"]});
    });
    content = <div className="fetching"></div>;
  }

  // Else if the relational "Entity page" quality for the class has not been
  // fetched yet, do so.
  else if (entityPageQualPath === undefined) {
    fetchRelevancyQualityPath(classKey, entityPageRel).then(qualPath => {
      this.setState({...this.state, entityPageQualPath: qualPath ?? false});
    });
    content = <div className="fetching"></div>;
  }

  // Else if the quality path is ready, but the top entry has not yet been
  // fetched, do that.
  else if (topEntry === undefined) {
    scoreHandler.fetchTopEntry(entityPageQualPath).then(topEntry => {
      this.setState({...this.state, topEntry: topEntry ?? false});
    });
    content = <div className="fetching"></div>;
  }
  
  // Else if the top entry is ready, expect it to be an entity of the "App
  // component" class, with a "Component path" attribute, and render this via
  // the ComponentEntityComponent.
  else {
    let [compEntID, score] = topEntry;
    // If the score is not positive, reject the top entry and behave as if the
    // list is empty.
    if (score <= 0) {
      return (
        <div className="missing"></div>
      );
    }
    content = <ComponentEntityComponent {...props} compEntID={compEntID} />;
  }

  // Return the content, together with an initial link to the component class
  // (which can always be hidden by the style, say, if the component already
  // contains this link), which allows users to inspect alternative entity pages
  // for this class, and to score them and/or add new ones themselves.
  return (
    <div className="variable-component">
      <div className="class-link">
        <EntityLink key="class" entKey={classKey} />
      </div>
      {content}
    </div>
  );
}

