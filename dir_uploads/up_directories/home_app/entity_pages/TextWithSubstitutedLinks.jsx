
import {replaceReferences} from 'entities';
import * as EntityOrRouteReference
from "../utility_components/EntityOrRouteReference.jsx";


export function render({children}) {
  let substitutedSegmentArr = replaceReferences(children, (segment, ind) => (
    <EntityOrRouteReference key={ind} ident={segment} />
  ));
  return <span className="text-with-links">{substitutedSegmentArr}</span>;
}
