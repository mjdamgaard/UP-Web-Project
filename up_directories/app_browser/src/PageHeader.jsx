



export function render({entDef, entID, ancCatIDs, ancAppIDs}) {
  return <div className="page-header">
    <div>
      Name: {entDef["Name"]} 
    </div>
    <div>
      entID: {entID} 
    </div>
  </div>
}