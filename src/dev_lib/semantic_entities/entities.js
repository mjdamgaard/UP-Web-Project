
import {DevFunction} from "../../interpreting/ScriptInterpreter.js";

const segmentRegEx =
  /#[0-9a-f]*|\/([^\s]*[~a-zA-Z0-9_\-])?|\\([\s\S]|$)|([^#/\\]|(?<=\S)[#/])+/g;


// replaceReferences() parses a string and returns an array of segments, where
// all contained entity keys and routes are parsed as their own segment, and
// then replaced by a user-provided callback. 
export const replaceReferences = new DevFunction(
  "replaceReferences", {typeArr: ["string", "function"]},
  ({callerNode, execEnv, interpreter}, [str, callback]) => {
    // Use String.match() to split the string into an array where each entity
    // key or file route is put into its own array entry.
    let segmentArr = str.match(segmentRegEx) ?? [];
    
    // Go through each segment, and if it is an entity key or route, replace it
    // in the array with the return value of callback, called on the segment
    // and on the segment index.
    let substitutedSegmentArr = segmentArr.map((segment, ind) => {
      let startChar = segment[0];
      if (startChar === "#" || startChar === "/") {
        return interpreter.executeFunction(
          callback, [segment, ind], callerNode, execEnv
        );
      }
      else if (startChar === "\\") {
        return segment.substring(1);
      }
      else {
        return segment;
      }
    });

    // Then return the array of segments (as the replacements might be JSX
    // elements, and thus the user might not wish them .join()'ed).
    return substitutedSegmentArr;
  }
);



// TODO: Consider reimplementing some of the functions from the /1/1/entities.js
// user library as dev functions exported from this library. 