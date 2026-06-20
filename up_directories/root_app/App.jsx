
import {clearPermissions} from 'query';
import {urlActions, urlEvents} from "./urlActions.js";




export function render({
  appDirID, homeURL, tailURL,
}) {
  return (
    <div className="app">
      
    </div>
  );
}



export const events = [
  ...urlEvents,
];


export const actions = {
  ...urlActions,
};



export const styleSheets = [
  abs("./style.css"),
];
