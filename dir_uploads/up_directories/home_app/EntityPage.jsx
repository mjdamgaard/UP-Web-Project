
import {indexOf, substring} from 'string';


export function render({url, history}) {
  let indOfSlash = indexOf(url, "/");
  let entID = substring(url, 0, indOfSlash);
  return (
    <div></div>
  );
}
