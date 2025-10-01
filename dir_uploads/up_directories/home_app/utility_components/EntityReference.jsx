
import {fetchEntityDefinition, fetchEntityID} from "/1/1/entities.js";
import {splitStringAlongEntityKeyEndPoints} from 'entities';
import {map} from 'array';
import * as ILink from 'ILink.jsx';


// TODO: We should at some point probably change this component into something
// else. But for now, we will just let it fetch the given entity's definition,
// look at the "Name" ?? "Title" ?? "Label" attribute, and then render an ILink
// with that as its content, but also where we parse the name/title/label and
// substitute any entity key with a nested EntityReference (with isLink=false).


export function render({entKey, isLink = true, pushState = undefined}) {
  let {entDef, entID} = this.state;
  pushState ??= isLink ? (this.subscribeToContext("history") ?? {}).pushState :
    undefined;
  let className, content = "";

  // If the entity definition has not been fetched, do so. And if isLink is
  // true, also fetch the entity ID.
  if (entDef === undefined) {
    fetchEntityDefinition(entKey).then(entDef => {
      this.setState({...this.state, entDef: entDef ?? false});
    });
  }
  if (isLink && entID === undefined) {
    fetchEntityID(entKey).then(entID => {
      this.setState({...this.state, entID: entID ?? false});
    });
  }

  // And if waiting for the entity definition, render an empty component with
  // "fetching" class.
  if (entDef === undefined) {
    className = "entity-reference fetching";
  }

  // Else if the entity does not exist, render a missing entity title.
  else if (!entDef) {
    className = "entity-reference missing-entity";
  }

  // Else if still needing the entID to be fetched, wait for that.
  else if (isLink && entID === undefined) {
    className = "entity-reference fetching";
  }

  // And if it turns out to be missing, render a missing entity title.
  else if (isLink && !entID) {
    className = "entity-reference missing-entity";
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
    className = "entity-reference missing-title";
    }

    // Else call splitStringAlongEntityKeyEndPoints in order to parse the title
    // and identify the nested entity keys, if any.
    let [segmentArr, isEntKeyArr] = splitStringAlongEntityKeyEndPoints(title);
    let EntityReference = this.component;
    content = map(segmentArr, (segment, ind) => (
      isEntKeyArr[ind] ?
        <EntityReference entKey={segment} isLink={false} /> :
        segment
    ));
    className = "entity-reference";
  }

  // Then return either an ILink or a span element, depending on isLink.
  return isLink ?
    <span className={className}>
      <ILink key="0" href={"/e/" + entID} pushState={pushState} >{
        content
      }</ILink>
    </span> :
    <span className={className}>{content}</span>;
}
