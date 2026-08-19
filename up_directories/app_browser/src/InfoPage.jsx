
import * as TextDisplay from "../../utilities/TextDisplay.jsx";


export function render({entID, entDef}) {
  let appDirID = entDef["App directory ID"];
  let desc = entDef["Description"] || undefined;
  return <div>
    <div>
      Title: {entDef["Name"]}
    </div>
    <div>
      Entity ID: {entID}
    </div>
    <div>{!appDirID ? undefined :
    "App directory ID: " + entDef["App directory ID"]
    }</div>
    <div>
      <h4>Description:</h4>
      {(desc ?
        <TextDisplay key="t" untrusted>{(desc)}</TextDisplay> :
        <i>None</i>
      )}
    </div>
  </div>
}