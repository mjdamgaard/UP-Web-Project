import {useState, createContext, useContext, useEffect} from "react";
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
        {...extraProps} entID={entID} entDataArr={entDataArr} exceedsRecLevel
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

  // // If entity is missing from the database, return ChildModule with the
  // // boolean entIsMissing set.
  // if (!entData) {
  //   return (
  //     <ChildModule
  //       {...extraProps} entID={entID} entDataArr={newEntDataArr} entIsMissing
  //     />
  //   );
  // }

  // // If the entity neither has a parent nor a ownStruct, return
  // // ChildModule with the boolean entIsInvalid set.
  // if (!parentID && !ownStruct) {
  //   return (
  //     <ChildModule
  //       {...extraProps} entID={entID} entDataArr={entDataArr} entIsInvalid
  //     />
  //   );
  // }

  // // If

  // // If not, pass the data to EntityTitleFromParent to query the parent for
  // // more data to construct the full ownStruct.
  // return (
  //   <PropStructFetcherHelper
  //     entID={entID} PlaceholderModule={PlaceholderModule}
  //     ChildModule={ChildModule} extraProps={extraProps}
  //     parentID={parentID} spec={spec} ownStruct={ownStruct}
  //     entDataArr={entDataArr} recLevel={1} maxRecLevel={maxRecLevel}
  //   />
  // );
}



const PropStructConstructor = ({
  entID, entDataArr, exceedsRecLevel, ChildModule, extraProps,
  PlaceholderModule,
}) => {
  extraProps ??= {};
  PlaceholderModule ??= () => <></>;

  // If the recLevel has been exceeded, simple return the ChildModule with
  // the boolean exceedsRecLevel set.
  if (exceedsRecLevel) {
    return (
      <ChildModule
        {...extraProps} entID={entID} propStruct={{}} exceedsRecLevel
      />
    );
  }

  // Else construct a reverse version of entDataArr without the first element
  // (== entID).
  const dataArr = [...entDataArr].reverse();
  dataArr.pop();

  // Now go through each element (from root ancestor's data down to the
  // entity's own data) and construct the full propStruct

  //..Oh, I should actually get the full propStruct of the parent first, and
  // *then* insert the spec inputs..

  // Call getTransPropStruct() to construct the transformed propStruct.
  const transPropStruct = getTransformedPropStruct(
    parPropStruct, spec, propStruct
  );



  // // Before results is fetched, render this:
  // if (!results.isFetched) {
  //   return (
  //     <PlaceholderModule {...extraProps} entID={entID} recLevel={recLevel} />
  //   );
  // }
  
  // // Afterwards, first extract the needed data from results.
  // const entData = results.data[0] ?? [];
  // const [parParentID, parSpec, parPropStruct, parDataLen] = entData;

  // // If parParentID is undefined, meaning that the ancestor is missing, return
  // // ChildModule with the boolean ancIsMissing set.
  // if (parParentID === undefined) {
  //   return (
  //     <ChildModule
  //       {...extraProps} entID={entID} entDataArr={entDataArr.concat([entData])}
  //       ancIsMissing
  //     />
  //   );
  // }
  
  // If parent's parent is defined, pass to self yet another time to get more
  // data to construct the full propStruct.
  if (parParentID) {
    return (
      <PropStructFetcherHelper
      entID={entID} PlaceholderModule={PlaceholderModule}
      ChildModule={ChildModule} extraProps={extraProps}
      parentID={parParentID} spec={parSpec} propStruct={transPropStruct}
      entDataArr={entDataArr} recLevel={1} maxRecLevel={maxRecLevel}
      />
    );
  }

  // Else if parent's spec is defined while its parentID is not, return
  // ChildModule with the boolean ancIsInvalid set.
  if (parSpec) {
    return (
      <ChildModule
        {...extraProps} entID={entID} entDataArr={entDataArr} ancIsInvalid
      />
    );
  }

  // Else we now have that transPropStruct is the full propStruct of the
  // entity, and we can finally pass this to the ChildModule, along with other
  // props. 
  return (
    <ChildModule
      {...extraProps}
      entID={entID} fullPropStruct={transPropStruct} entDataArr={entDataArr}
    />
  );
}


export function getTransformedPropStruct(parPropStruct, spec, propStruct) {
  return Object.assign(getSpecifiedPropStruct(parPropStruct, spec), propStruct);
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
        let [leadingChars, n] = val.match(/^[^%]*|%.*$/g);
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
