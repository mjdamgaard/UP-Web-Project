
import * as EntityReference from "../misc/EntityReference.jsx";
import {fetchScalarEntityPath} from "/1/1/entities.js";


export function render({
  subjKey, qualKey = undefined, extQualKey = qualKey,
  hasLinks = undefined, linkLevel = undefined
}) {
  let {scalarPath, isFetching} = this.state;

  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    fetchScalarEntityPath(subjKey, extQualKey).then(scalarPath => {
      this.setState(state => ({...state, scalarPath: scalarPath}));
    });
    return <span className="fetching">{"..."}</span>;
  }

  else if (!scalarPath) {
    return <span className="fetching">{"..."}</span>;
  }

  return <EntityReference key="0" entKey={scalarPath}
    hasLinks={hasLinks} linkLevel={linkLevel}
  />;

  // return <span>
  //   <EntityReference key="s" entKey={subjKey} />
  //   {" ⇒ "}
  //   <EntityReference key="q" entKey={qualKey} />
  // </span>;
}