
import {toString} from 'string';




export function render({entID, name}) {
  return <div className="class-page">
    <h3>{toString(name)}</h3>
  </div>
}