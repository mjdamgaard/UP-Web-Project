
import {replaceReferences} from 'entities';
import * as EntityReference from "../utility_components/EntityReference.jsx";


export function render({children}) {
  let substitutedSegmentArr = replaceReferences(children, (segment, ind) => (
    <EntityReference key={ind} entKey={segment} />
  ));
  return <span className="text-with-links">{substitutedSegmentArr}</span>;
}
