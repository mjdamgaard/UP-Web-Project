
import {fetchRelationalQualityPath} from "/1/1/entities.js";
import {map} from 'array';
import {hasType} from 'type';

import * as EntityListMenu from "./EntityListMenu.jsx";

const VariableEntityElementPromise = import(
  "../variable_components/VariableEntityElement.jsx"
);

// TODO: This component should at some point be extended with a menu for
// changing the sorting and filtering options.

// TODO: The "Add new" menu should be changed for all lists where the
// "Subject class" of the relation is or is a subset of the 'Texts' class, such
// that for these lists, the user can add a comment directly.

// By the way, another todo, which is not about this component directly, is
// to extend and enhance our scoreHandler such that we don't just use the
// second-hand trusted user group for everything. In particular we should use
// a more carefully governed user group for UI safety (used to prevent
// phishing attempts, and such). *Well, maybe we should just increase the
// weight required for the variable components to use the component entity.
// Let's just do this for now.



// This component takes either a quality, a relation--object pair, or a class,
// and renders a list of entities fetched either from the provided quality, or
// from the relational quality formed by either the relation--object pair, or
// the class.
export function render({
  qualKey, relKey, objKey, classKey, hideMenu = false,
  scoreHandler = undefined, options = undefined,
  minScore = undefined, minWeight = 10,
  paginationLength = 50, paginationIndex = 0,
}) {
  scoreHandler = scoreHandler ?? this.subscribeToContext("scoreHandler");
  let {
    ElementComponent, qualPath, list, curMinScore, curMinWeight
  } = this.state;
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

  // Also, if ElementComponent is a promise, wait for it and replace it with
  // its result. 
  else if (hasType(ElementComponent, "promise")) {
    ElementComponent.then(result => {
      this.setState(state => ({...state, ElementComponent: result}));
    });
    content = <div className="fetching">{"..."}</div>;
  }

  // And if everything is ready, render the elements. TODO: Only render some
  // elements, namely in a pagination.
  else {
    content = [
      hideMenu ? undefined : <EntityListMenu key="menu"
        qualKeyArr={[qualKey ?? qualPath]}
        minScore={minScore} minWeight={minWeight}
      />,
      <hr/>,
      <div className="list-container">{
        map(list, ([entID, score, weight]) => (
          (
            curMinScore !== undefined && score < curMinScore ||
            curMinWeight !== undefined && weight < curMinWeight
          ) ? undefined :
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


export function getInitialState({
  ElementComponent = VariableEntityElementPromise,
  options, minScore, minWeight,
}) {
  minScore ??= options?.lo;
  minWeight ??= 10;
  return {
    ElementComponent: ElementComponent,
    curMinScore: minScore, curMinWeight: minWeight,
  }; 
}



export const events = [
  "updateListLimits",
];


export const actions = {
  "updateListLimits": function([minScore, minWeight]) {
    this.setState(state => ({
      ...state, curMinScore: minScore, curMinWeight: minWeight,
    }));
  }
};



export const styleSheetPaths = [
  abs("./EntityList.css"),
];