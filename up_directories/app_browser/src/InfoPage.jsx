
import * as TextDisplay from "../../utilities/TextDisplay.jsx";


export function render({entID, entDef}) {
  let appDirID = entDef["App directory ID"];
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
      <TextDisplay key="t" untrusted>{(entDef["Description"])}</TextDisplay>
    </div>
  </div>
}