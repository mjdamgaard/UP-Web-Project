
import {fetchRelationalQualityPath} from "/1/1/entities.js";

import * as QualityEntityElement from "./QualityEntityElement.jsx";


export function render({
  subjKey, qualKey = undefined, objKey = undefined, relKey = undefined,
  classKey = undefined, score = undefined, weight = undefined,
}) {
  let {qualPath} = this.state;
  qualKey ??= qualPath;

  // If the qualKey prop is undefined, and qualPath has not yet been fetched,
  // do so.
  if (qualKey === undefined) {
    fetchRelationalQualityPath(objKey ?? classKey, relKey).then(qualPath => {
      this.setState(state => ({...state, qualPath: qualPath ?? false}));
    });
    return <div className="fetching">{"..."}</div>;
  }

  else if (!qualKey) {
    content = <div className="missing">{"missing"}</div>;
  }

  return <QualityEntityElement key="_0"
    qualKey={qualKey} objKey={subjKey} score={score} weight={weight}
  />;
}
