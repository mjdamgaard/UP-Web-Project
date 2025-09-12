
import {
  fetchRelevancyQualityPath, fetchEntityDefinition
} from "/1/1/entities.js";

import * as EntityLink from "./EntityLink.jsx";


// TODO: We can reimplement this component using fewer HTTP rounds if we
// instead call a server module that fetches the componentPath for us, perhaps
// where we also give it a path to the score handler to use. 



export function render(props) {
  let {classKey, showClass = true} = props;
  let scoreHandler = this.subscribeToContext("score-handler");
  let {relevancyQualPath, topEntry, componentDef, Component} = this.state;
  let content;

  // If the relevancy quality for the class has not been fetched yet, do so.
  if (relevancyQualPath === undefined) {
    fetchRelevancyQualityPath(classKey).then(qualPath => {
      this.setState({...this.state, relevancyQualPath: qualPath ?? false});
    });
    content = <div className="fetching"></div>;
  }

  // And if it has, but is missing in the database, render an empty variable
  // component (possibly with some ::after content).
  else if (!relevancyQualPath) {
    content = <div className="missing"></div>;
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
  // render an empty variable component.
  else if (!topEntry) {
    content = <div className="missing"></div>;
  }

  // Else if the top entry is ready, expect it to have a "Component path"
  // attribute at which to find the component to render. If this component path
  // is not already gotten, fetch the entity's definition which ought to
  // contain it.
  else if (componentDef === undefined) {
    let [compEntID, score] = topEntry;
    if (score <= 0) {
      return (
        <div className="missing"></div>
      );
    }
    fetchEntityDefinition(compEntID).then(compDef => {
      this.setState({...this.state, compDef: compDef});
    });
    content = <div className="fetching"></div>;
  }

  // And if the component is not already imported, do so.
  else if (Component === undefined) {
    let componentPath = componentDef["Component path"];
    import(componentPath).then(Component => {
      this.setState({...this.state, Component: Component});
    });
    content = <div className="fetching"></div>;
  }

  // Finally, if the component is ready, render it, passing it the same props
  // is this component, except that showClass is turned into classWasShown
  // instead. TODO: Implement such that showClass is removed, after having
  // first implemented "...rest" syntax for object destructuring.
  else {
    content = <div>
      <Component key="comp" {...props} classWasShown={showClass} />
    </div>;
  }

  return (
    <div className="variable-component">
      {showClass ? (
        <div className="class-link">
          <EntityLink key="class" entKey={classKey} />
        </div>
      ) : undefined}
      {content}
    </div>
  );
}



export const actions = {
  "relevancy-quality-has-been-posted": function(qualPath) {
    this.setState({...this.state, relevancyQualPath: qualPath ?? false});
  },
};

export const events = [
  "relevancy-quality-has-been-posted",
];
