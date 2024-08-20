import {useState, createContext, useContext, useEffect, useDebugValue} from "react";
import {useQuery} from "../hooks/DBRequests.js";
import {ColumnContext} from "../contexts/ColumnContext.js";



export const EntityDataFetcher = ({
  entID, ChildModule, extraProps, PlaceholderModule, maxRecLevel,
  recLevel, entDataArr,
}) => {
  extraProps ??= {};
  PlaceholderModule ??= () => <></>;
  maxRecLevel ??= 6;
  recLevel ??= 0;
  entDataArr ??= [entID];

  const [results, setResults] = useState([]);
  useQuery(results, setResults, {
    req: "ent",
    id: entID,
  });

  // If the recursion level exceeds the maximum, return ChildModule with the
  // boolean exceedsRecLevel set.
  if (recLevel > maxRecLevel) {
    return (
      <ChildModule
        {...extraProps} entID={entID} entDataArr={entDataArr}
      />
    );
  }

  // Before results is fetched, render this:
  if (!results.isFetched) {
    return (
      <PlaceholderModule {...extraProps} entID={entID} recLevel={recLevel} />
    );
  }
  
  // Afterwards, first extract the needed data from results.
  const entData = results.data[0] ?? null;
  const [parentID, spec, ownStruct, dataLen] = entData ?? [];
  const newEntDataArr = entDataArr.concat([entData]);

  // If entity is missing or parentID is falsy, return ChildModule.
  if (!entData || !parentID) {
    return (
      <ChildModule {...extraProps} entID={entID} entDataArr={newEntDataArr} />
    );
  }

  // Else call self recursively to get even more entity data.
  return (
    <EntityDataFetcher
      entID={parentID} ChildModule={ChildModule} extraProps={extraProps}
      PlaceholderModule={PlaceholderModule} maxRecLevel={maxRecLevel}
      recLevel={recLevel} entDataArr={newEntDataArr}
    />
  );
}



export function getPropStruct(entDataArr) {
  // First construct a reverse version of entDataArr without the first element
  // (== entID), and the last element, which is the root ancestor data.
  var dataArr = [...entDataArr];
  const rootData = dataArr.pop();
  dataArr.reverse();
  const entID = dataArr.pop();

  // Then first of all check that rootData is of a valid root ancestor, and
  // if not, return null.
  if(rootData[0] || rootData[1] || !rootData[2]) {
    return null;
  }

  // Now go through each element in dataArr (from root ancestor's first child
  // and down to entity itself) and construct the full propStruct.
  var propStruct = {...rootData[2]};
  dataArr.forEach(entData => {
    let spec = entData[1];
    let ownStruct = entData[2];
    propStruct = getTransformedPropStruct(propStruct, spec, ownStruct);
    console.log(entData);console.log(propStruct);
  });

  // And finally return the constructed full propStruct.
  return propStruct;
}



export function getTransformedPropStruct(parPropStruct, spec, ownStruct) {
  return Object.assign(getSpecifiedPropStruct(parPropStruct, spec), ownStruct);
}

export function getSpecifiedPropStruct(parPropStruct, spec) {
  var specArr = (typeof spec === "string") ? getSpecArr(spec) : spec;

  // Replace each '%<n>' placeholder in parPropStruct with specArr[<n> - 1].
  // If a specArr[<n> - 1] is undefined, let the placeholder be. Note that is
  // is assumed that '%<n>' will always be followed by space or some sort of
  // punctuation, and never directly by other digits or another placeholder. 
  var ret = {};
  Object.keys(parPropStruct).forEach(prop => {
    let val = parPropStruct[prop];
    // If property value is a string, replace e.g. '%3' with specArr[2], and
    // '\\\\%3' with '\\\\' + specArr[2], unless specArr[2] is undefined.
    if (typeof val === "string") {
      ret[prop] = val.replaceAll(/(^|[^\\%])(\\\\)*%[1-9][0-9]*/g, str => {
        let [leadingChars, n] = val.match(/^[^%]*|[^%].*$/g);
        if (n === undefined) {
          n = leadingChars;
          leadingChars = "";
        }
        let placement = specArr[parseInt(n) - 1];
        if (placement !== undefined) {
          return leadingChars + placement;
        } else {
          return str;
        }
      });
    }
    // Else call getSpecifiedPropStruct recursively to get the substituted val.
    else {
      ret[prop] = getSpecifiedPropStruct(val, specArr);
    }
  });
  return ret;
}

export function getSpecArr(spec) {
  return spec
    .replaceAll("\\\\", "\\\\0")
    .replaceAll("\\|", "\\\\1")
    .split("|")
    .map(val => {
      return val
      .replaceAll("\\\\1", "|")
      .replaceAll("\\\\0", "\\");
    });

}
