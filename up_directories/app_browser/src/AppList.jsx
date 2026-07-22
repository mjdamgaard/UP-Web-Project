
import {map} from 'array';
import * as AppElement from "./AppElement.jsx";


export function render({list, objID, ancCatIDs, ancAppIDs}) {
  return map(list, ([subjID]) => (
    <AppElement key={"e-" + subjID} entID={subjID}
      objID={objID} ancCatIDs={ancCatIDs} ancAppIDs={ancAppIDs}
    />
  ));
}