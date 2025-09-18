
import {fetchRelevancyQualityPath} from "/1/1/entities.js";
import {map} from 'array';


// TODO: This component should at some point be extended with a menu for
// changing the sorting and filtering options. And it should maybe also at some
// point get an API that allows it to push browser history states such that
// the currently focussed entity can be scrolled to automatically again when
// the page reloads (after we have also implemented such scroll actions/methods
// (unless wanting to implement it in another way)).. 

// TODO: And a much more urgent todo is to add some button at the top to add
// a new entry to the entity list.


// This component takes either a quality, a relation--object pair, or a class,
// and renders a list of entities fetched either from the provided quality, or
// from the relevancy quality formed by either the relation--object pair, or
// the class.
export function render({
  qualKey, relKey, objKey, classKey, ElementComponent, scoreHandler,
  options = undefined, paginationLength = 50, paginationIndex = 0,
}) {
  scoreHandler = scoreHandler ?? this.subscribeToContext("score-handler");
  let {qualPath, list} = this.state;
  let content;

  // If the qualKey prop is undefined, and qualPath has not yet been fetched,
  // do so.
  if (!qualKey && qualPath === undefined) {
    fetchRelevancyQualityPath(relKey ?? classKey, objKey).then(qualPath => {
      this.setState({...this.state, qualPath: qualPath ?? false});
    });
    content = <div className="fetching"></div>;
  }

  // Else use the qualKey ?? qualPath to fetch the scored list to show, if it
  // hasn't been fetched already.
  else if (list === undefined) {
    scoreHandler.fetchList(qualKey ?? qualPath, options).then(list => {
      this.setState({...this.state, list: list ?? []});
      content = <div className="fetching"></div>;
    });
  }

  // And if the list is ready, render the elements. TODO: Only render some
  // elements, namely in a pagination.
  else {
    content = map(list, ([entID, score, weight]) => (
      <ElementComponent key={entID}
        entID={entID} score={score} weight={weight}
      />
    ));
  }

  return (
    <div className="entity-list">{content}</div>
  );
}
