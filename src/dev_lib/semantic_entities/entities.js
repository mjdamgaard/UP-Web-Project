
import {DevFunction} from "../../interpreting/ScriptInterpreter.js";

const onlyEntPathRegEx = /^\/[/~.a-zA-Z0-9_\-]+$/;
const segmentRegEx = /\$\{[/~.a-zA-Z0-9_\-]+\}|\\([\s\S]|$)|[^\\$]+|[\s\S]/g;
const internalReferenceRegEx = /^\$\{([/~.a-zA-Z0-9_\-]+)\}$/;


// replaceReferences() parses a string and returns an array of segments, where
// all contained entity keys and routes are parsed as their own segment, and
// then replaced by a user-provided callback. 
export const replaceReferences = new DevFunction(
  "replaceReferences", {typeArr: ["string", "function"]},
  ({callerNode, execEnv, interpreter}, [str, callback]) => {
    // If the string appears to be an absolute path and nothing else, treat the
    // whole string as an entity reference.
    if (onlyEntPathRegEx.test(str)) {
      return [
        interpreter.executeFunction(
          callback, [str, 0], callerNode, execEnv
        )
      ];
    }

    // Else, first use String.match() to split the string into an array where
    // each entity key or file route is put into its own array entry.
    let segmentArr = str.match(segmentRegEx) ?? [];
    
    // Then go through each segment, and if it is an entity key or route,
    // replace it in the array with the return value of callback, called on the
    // segment and on the segment index.
    let substitutedSegmentArr = segmentArr.map((segment, ind) => {
      let [match, entKey] = internalReferenceRegEx.exec(segment) ?? [];
      if (match) {
        return interpreter.executeFunction(
          callback, [entKey, ind], callerNode, execEnv
        );
      }
      else if (segment[0] === "\\" && segment.length > 1) {
        return segment.substring(1);
      }
      else {
        return segment;
      }
    });

    // Then return the array of segments (as the replacements might be JSX
    // elements, and thus the user might not wish them to be concatenated).
    return substitutedSegmentArr;
  }
);



// TODO: Consider reimplementing some of the functions from the /1/1/entities.js
// user library as dev functions exported from this library. 