
import {
  fetchEntityDefinition, fetchEntityPath, fetchEntityID,
} from "/1/1/entities.js";
import {replaceReferences} from 'entities';
import * as ILink from 'ILink.jsx';



export function getInitialState({entKey}) {
  return {curEntKey: entKey};
}


export function render({
  key, entKey = key, isLink = true, isFull = false, isElaboration = false,
  hasLinks = isElaboration && !isLink, recLevel = 0, pushState = undefined
}) {
  let {curEntKey, entDef, entPath, entID} = this.state;
  pushState ??= isLink ? (this.subscribeToContext("history") ?? {}).pushState :
    undefined;
  let EntityReference = this.component;
  let content = "", href = "./";

  // If the entKey prop has changed, reset the state.
  if (entKey !== curEntKey) {
    this.setState(getInitialState(this.props));
  }

  // If the entity definition has not been fetched, do so. And if isLink is
  // true, also fetch the entity ID. And if recLevel is too high, fetch the
  // entity ID.
  if (entDef === undefined) {
    fetchEntityDefinition(entKey).then(entDef => {
      this.setState(state => ({...state, entDef: entDef ?? false}));
    });
    if (isLink && entPath === undefined) {
      fetchEntityPath(entKey).then(entPath => {
        this.setState(state => ({...state, entPath: entPath ?? false}));
      });
    }
    if (recLevel > 4) {
      fetchEntityID(entKey).then(entID => {
        this.setState(state => ({...state, entPath: entID ?? null}));
      });
    }
  }

  // If the recursion level is too high and entID is fetched, just render the
  // entID (possibly null).
  if (recLevel > 4) {
    content = (entID === undefined) ?
      <span className="fetching">{"..."}</span> :
      <span className="entity-id">{entID}</span>;
  }

  // And else if waiting for the entity definition, render a "fetching" span,
  // which can be restyled at will.
  else if (entDef === undefined) {
    content = <span className="fetching">{"..."}</span>;
  }

  // Else if the entity does not exist, render a missing entity title.
  else if (!entDef) {
    content = <span className="missing">{"missing"}</span>;
  }

  // Else check that entDef is indeed an entity definition, with a "Class"
  // attribute, and if not, return and ILink to the file browser instead.
  else if (typeof entDef !== "object" || !entDef.Class) {
    content = entKey;
    href = "~/f" + entKey;
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
    // none is found, render an empty component with a "missing" class.
    let title = entDef["Name"] ?? entDef["Title"] ?? entDef["Label"];
    if (typeof title !== "string") {
      content = <span className="missing">{"missing"}</span>;
    }

    // if isFull is true, use the full title instead.
    let fullTitle = entDef["Full name"] ?? entDef["Full title"] ??
      entDef["Full label"] ?? title;
    if (isFull) {
      title = fullTitle;
    }

    // Or if isElaboration is true, use the elaboration instead.
    let elaboration = entDef["Elaboration"] ?? fullTitle;
    if (isElaboration) {
      title = elaboration;
    }

    // Else call replaceReferences in order to parse the title and substitute
    // any nested entity keys with EntityReferences.
    else {
      let substitutedSegmentArr = replaceReferences(title, (refEntKey, ind) => (
        <EntityReference key={ind}
          entKey={refEntKey} isLink={hasLinks} isFull={false}
        />
      ));
      content = substitutedSegmentArr;
      href = "~/entPath" + entPath;
    }
  }

  // And else return a span element either with or without an ILink, depending
  // on the 'isLink' prop.
  return isLink ?
    <span className={"entity-reference"}>
      <ILink key="0" href={href} pushState={pushState} >{
        content
      }</ILink>
    </span> :
    <span className={"entity-reference"}>{content}</span>;
}
