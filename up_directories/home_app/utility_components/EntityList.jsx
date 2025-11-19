
import {fetchRelationalQualityPath} from "/1/1/entities.js";
import {map} from 'array';

import * as VariableEntityElement
from "../variable_components/VariableEntityElement.jsx";
import * as AddEntityMenu from "./AddEntityMenu.jsx";


// TODO: This component should at some point be extended with a menu for
// changing the sorting and filtering options. And it should maybe also at some
// point get an API that allows it to push browser history states such that
// the currently focussed entity can be scrolled to automatically again when
// the page reloads (after we have also implemented such scroll actions/methods
// (unless wanting to implement it in another way))..

// TODO: This sorting/filtering/search should not least include an option to
// see the "new" entities (those without a weight above 10), and/or see the
// entities with a negative score (when dealing with the 'Predicate metric').

// By the way, another todo, which is not about this component directly, is
// to extend and enhance our scoreHandler such that we don't just use the
// second-hand trusted user group for everything. In particular we should use
// a more carefully governed user group for UI safety (used to prevent
// phishing attempts, and such).

// TODO: The "Add entity" menu should be changed for all lists where the
// "Subject class" of the relation is or is a subset of the 'Texts' class, such
// that for these lists, the user can add a comment directly.




// This component takes either a quality, a relation--object pair, or a class,
// and renders a list of entities fetched either from the provided quality, or
// from the relational quality formed by either the relation--object pair, or
// the class.
export function render({
  qualKey, relKey, objKey, classKey, ElementComponent = VariableEntityElement,
  scoreHandler = undefined, options = undefined,
  paginationLength = 50, paginationIndex = 0,
}) {
  scoreHandler = scoreHandler ?? this.subscribeToContext("scoreHandler");
  let {qualPath, list, menuExtension} = this.state;
  let content;

  // If the qualKey prop is undefined, and qualPath has not yet been fetched,
  // do so.
  if (!qualKey && qualPath === undefined) {
    fetchRelationalQualityPath(objKey ?? classKey, relKey).then(qualPath => {
      this.setState(state => ({...state, qualPath: qualPath ?? false}));
    });
    content = <div className="fetching">{"..."}</div>;
  }

  // Else use the qualKey ?? qualPath to fetch the scored list to show, if it
  // hasn't been fetched already.
  else if (list === undefined) {
    scoreHandler.fetchList(qualKey ?? qualPath, options).then(list => {
      this.setState(state => ({...state, list: list ?? []}));
    });
    content = <div className="fetching">{"..."}</div>;
  }

  // And if the list is ready, render the elements. TODO: Only render some
  // elements, namely in a pagination.
  else {
    content = [
      <div className="entity-list-menu">
        <button onClick={() => {
          this.setState(state => ({
            ...state, menuExtension: <AddEntityMenu key="add"
              qualKeyArr={[qualKey ?? qualPath]}
            />
          }));
        }}>{"Add new"}</button>
      </div>,
      <div className="menu-extension">{menuExtension}</div>,
      <hr/>,
      <div className="list-container">{
        map(list, ([entID, score, weight]) => (
          <ElementComponent key={"_" + entID}
            entID={entID} score={score} weight={weight}
            qualKeyArr={[qualKey ?? qualPath]}
          />
        ))
      }</div>,
    ];
  }

  return (
    <div className="entity-list">{content}</div>
  );
}
