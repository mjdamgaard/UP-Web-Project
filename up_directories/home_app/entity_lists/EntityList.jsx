
import {map, slice} from 'array';
import {hasType} from 'type';
import {combineLists, sortListWRTScore} from 'scored_lists';
import {fetchQualityKey, fetchQualityKeyArray} from "./quality_keys.js";

import * as EntityListMenu from "./EntityListMenu.jsx";

const membersRel = "/1/1/em1.js;get/members";

const VariableEntityElementPromise = import(
  "../variable_components/VariableEntityElement.jsx"
);

// TODO: This component should at some point be extended with a menu for
// changing the sorting and filtering options.

// TODO: The "Add new" menu should be changed for all lists where the
// "Subject class" of the relation is or is a subset of the 'Texts' class, such
// that for these lists, the user can add a comment directly.

// By the way, another todo, which is not about this component directly, is
// to extend and improve our scoreHandler such that we don't just use the
// second-hand trusted user group for everything. In particular we should use
// a more carefully governed user group for UI safety (used to prevent
// phishing attempts, and such). *Well, maybe we should just increase the
// weight required for the variable components to use the component entity.
// Let's just do this for now.

// TODO: Implement the pagination.



// This component takes either a quality, a relation--object pair, or a class,
// and renders a list of entities fetched either from the provided quality, or
// from the relational quality formed by either the relation--object pair, or
// the class.
export function render({
  classKey, qualKey, objKey = classKey,
  relKey = classKey ? membersRel : undefined,
  extQualKeyArr = [qualKey ?? [objKey, relKey]],
  otherExtQualKeyArr = [], factorArr = [], constList = undefined,
  constElementArr = undefined, extraElementProps = {},
  scoreHandler = undefined, options = undefined,
  minScore = undefined, minWeight = 10, isAscending = false,
  hideMenu = false, paginationLength = 50, paginationIndex = 0,
}) {
  scoreHandler ??= this.subscribeToContext("scoreHandler");
  this.provideContext("extQualKeyArr", extQualKeyArr);
  let {
    ElementComponent, listArr, isFetching, curMinScore, curMinWeight,
    qualKeyArr, otherQualKeyArr
  } = this.state;
  let content;

  // If the lists are not yet being fetched, do so.
  if (isFetching === undefined) {
    this.setState(state => ({...state, isFetching: true}));

    // For each extended quality key, fetch the qualPath first in case of a
    // objKey--relKey pair, then fetch the list. We also make sure to get an
    // array of all the resulting qualKeys in the process, which we can pass to
    // EntityListMenu below.
    let qualKeyPromArr = map(extQualKeyArr, extQualKey => (
      fetchQualityKey(extQualKey)
    ));
    Promise.all(qualKeyPromArr).then(qualKeyArr => {
      this.setState(state => ({...state, qualKeyArr: qualKeyArr}));
    });
    let listPromArr = map(qualKeyPromArr, qualKeyProm => 
      new Promise(resolve => qualKeyProm.then(qualKey => {
        scoreHandler.fetchList(qualKey, options).then(
          list => resolve(list)
        );
      }))
    );
    Promise.all(listPromArr).then(listArr => {
      this.setState(state => ({...state, listArr: listArr}));
    });

    // Also, if ElementComponent is a promise, wait for it and replace it with
    // its result. 
    if (hasType(ElementComponent, "promise")) {
      ElementComponent.then(result => {
        this.setState(state => ({...state, ElementComponent: result}));
      });
    }

    // And also fetch the otherQualKeyArr, which are relevant qualities that
    // does should not (by default) be used for fetching and ordering the
    // elements of the list, but which might be relevant to score if adding new
    // entities to the list.
    fetchQualityKeyArray(otherExtQualKeyArr).then(otherQualKeyArr => {
        this.setState(state => ({...state, otherQualKeyArr: otherQualKeyArr}));
    }); 

    content = <div className="fetching">{"..."}</div>;
  }

  // Else if the lists have not yet returned, or the ElementComponent hasn't,
  // render a "fetching" placeholder.
  else if (
    listArr === undefined || hasType(ElementComponent, "promise") ||
    qualKeyArr === undefined || otherQualKeyArr === undefined
  ) {
    content = <div className="fetching">{"..."}</div>;
  }

  // And if everything is ready, render the elements. TODO: Only render some
  // elements, namely in a pagination.
  else {
    // First combine the lists into one.
    let list = (extQualKeyArr.length === 1 && !constList) ?
      (isAscending ? sortListWRTScore(listArr[0], isAscending) : listArr[0]) :
      constList ?
        combineLists([constList, ...listArr], factorArr, isAscending) :
        combineLists(listArr, factorArr, isAscending);
    list = slice(list, 0, paginationLength);

    // Then generate the content of the component.
    content = [
      hideMenu ? undefined : <EntityListMenu key="menu"
        qualKeyArr={qualKeyArr} otherQualKeyArr={otherQualKeyArr}
        objKey={objKey} minScore={minScore} minWeight={minWeight}
      />,
      <div className="list-container">
        {constElementArr}
        {map(list, ([entID, score, weight]) => (
          (
            curMinScore !== undefined && score < curMinScore ||
            curMinWeight !== undefined && weight < curMinWeight
          ) ? undefined :
            <ElementComponent key={"_" + entID}
              entID={entID} objKey={objKey}
              score={score} weight={weight}
              qualKeyArr={[qualKey]} {...extraElementProps}
            />
        ))}
      </div>,
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
  abs("../style.css"),
  abs("./EntityList.css"),
];