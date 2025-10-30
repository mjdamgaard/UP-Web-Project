
import * as EntityReference from "../utility_components/EntityReference.jsx";


export function render({qualKey, subjKey}) {

  return <span>
    <EntityReference key="s" entKey={subjKey} />
    {" ⇒ "}
    <EntityReference key="q" entKey={qualKey} />
  </span>;

}