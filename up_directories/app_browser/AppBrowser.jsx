
import {split, substring} from 'string';
import {at} from 'array';
import {fetchEntityID} from "../semantic_entities/entities.js";
import {urlActions, urlEvents} from "../root_app/urlActions.js";
import {getFirstSegment} from 'path';


export function render({url, homeURL, tailURL}) {
  let firstSegment = getFirstSegment(tailURL);

  // ...
}



export const actions = urlActions;

export const events = urlEvents;

