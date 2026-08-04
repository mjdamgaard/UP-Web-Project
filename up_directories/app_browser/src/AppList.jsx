
import * as AppElement from "./AppElement.jsx";


export function render({list, objID, ancCatIDs, ancAppIDs}) {
  return list.map(([subjID]) => (
    <AppElement key={"e-" + subjID} entID={subjID}
      objID={objID} ancCatIDs={ancCatIDs} ancAppIDs={ancAppIDs}
    />
  ));
}