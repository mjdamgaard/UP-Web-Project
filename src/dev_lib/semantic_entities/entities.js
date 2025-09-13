

// This function splits a string into an array where all entity keys are
// contained in their own entry. It then returns that array, along with a
// second array of booleans of whether the entry at the given index of the
// first array is an entity key. It also transforms all non-entity keys by
// removing any backslashes used to escape the entity key syntax. 
export const splitStringAlongEntityKeyEndPoints = new DevFunction(
  "splitStringAlongEntityKeyEndPoints", {typeArr: ["string"]}, ({}, [str]) => {
    // Use String.match() to split the string into an array where each entity
    // key is alone in its own array entry.
    let segmentArr = str.match(
      /#[0-9a-f]*|\/[^\s\\#]*)|\\([\s\S]|$)|[^#/\\]+/g
    ) ?? [];
    
    // Then initialize the is-entity-key array, and go through each entry,
    // transforming all non-entity-keys by removing backslashes, while also
    // filling out the isEntKeyArr along the way.
    isEntKeyArr = [];
    segmentArr.forEach((segment, ind) => {
      if (segment[0] === "#" || segment[0] === "/") {
        isEntKeyArr[ind] = true;
      }
      else {
        segmentArr[ind] = segment.replaceAll(/\\([\s\S])/g, (_, char) => char);
        isEntKeyArr[ind] = false;
      }
    });

    return [segmentArr, isEntKeyArr];
  }
);


// TODO: Consider reimplementing some of the functions from the /1/1/entities.js
// user library as dev functions exported from this library. 