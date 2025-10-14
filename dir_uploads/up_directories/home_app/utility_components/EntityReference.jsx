
import {fetchEntityDefinition, fetchEntityPath} from "/1/1/entities.js";
import {replaceReferences} from 'entities';

import * as ILink from 'ILink.jsx';
import * as EntityOrRouteReference from "./EntityOrRouteReference.jsx";


// TODO: We should at some point probably change this component into something
// more elaborate. But for now, we will just let it fetch the given entity's
// definition,  look at the "Name" ?? "Title" ?? "Label" attribute, and the
// render an ILink with that as its content, but also where we parse the
// name/title/label and substitute any entity key with a nested EntityReference
// (with isLink=false).



export function render(props) {
  let {entKey, isLink = true, pushState = undefined} = props;
  let {entDef, entPath, curEntKey} = this.state;
  pushState ??= isLink ? (this.subscribeToContext("history") ?? {}).pushState :
    undefined;
  let content = "", href = "./";

  // If the entKey prop has changed, reset the state.
  if (entKey !== curEntKey) {
    this.setState(getInitState(props));
  }

  // If the entity definition has not been fetched, do so. And if isLink is
  // true, also fetch the entity ID.
  if (entDef === undefined) {
    fetchEntityDefinition(entKey).then(entDef => {
      this.setState(state => ({...state, entDef: entDef ?? false}));
    });
  }
  if (isLink && entPath === undefined) {
    fetchEntityPath(entKey).then(entPath => {
      this.setState(state => ({...state, entPath: entPath ?? false}));
    });
  }

  // And if waiting for the entity definition, render an empty component with
  // "fetching" class.
  if (entDef === undefined) {
    content = <span className="fetching">{"..."}</span>;
  }

  // Else if the entity does not exist, render a missing entity title.
  else if (!entDef) {
    content = <span className="missing">{"missing"}</span>;
  }

  // Else if still needing the entID to be fetched, wait for that.
  else if (isLink && entPath === undefined) {
    content = <span className="fetching">{"..."}</span>;
  }

  // And if it turns out to be missing, render a missing entity title.
  else if (isLink && !entPath) {
    content = <span className="missing">{"missing"}</span>;
  }

  // Else, finally, render the entity reference, possibly with nested entity
  // references.
  else {
    // Get the title from the "Name" ?? "Title" ?? "Label" attribute, and if
    // none is found, render an empty component with a "missing" class. (TODO:
    // Consider inserting a component that allows the user to post the entity
    // if entKey is a path, but then again, this might not be what we want.)
    let title = entDef["Name"] ?? entDef["Title"] ?? entDef["Label"];
    if (typeof title !== "string") {
      content = <span className="missing">{"missing"}</span>;
    }

    // Else call replaceReferences in order to parse the title and substitute
    // any nested entity keys with EntityReferences.
    else {
      let substitutedSegmentArr = replaceReferences(title, (refIdent, ind) => (
        <EntityOrRouteReference key={ind} ident={refIdent} isLink={false} />
      ));
      content = substitutedSegmentArr;
      href = "/e" + entPath;
    }
  }

  // Then return either an ILink or a span element, depending on isLink.
  return isLink ?
    <span className={"entity-reference"}>
      <ILink key="0" href={href} pushState={pushState} >{
        content
      }</ILink>
    </span> :
    <span className={"entity-reference"}>{content}</span>;
}



export function getInitState({entKey}) {
  return {curEntKey: entKey};
}
