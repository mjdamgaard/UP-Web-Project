
import {hasType} from 'type';
import {map} from 'array';
import {fetchRelationalQualityPath, fetchEntityPath} from "/1/1/entities.js";

export function fetchQualityKeyArray(extQualKeyArr) {
  return new Promise(resolve => {
    let qualKeyPromArr = map(extQualKeyArr, extQualKey => (
      fetchQualityKey(extQualKey)
    ));
    Promise.all(qualKeyPromArr).then(qualKeyArr => resolve(qualKeyArr));
  });
}


export function fetchQualityKey(extQualKey) {
  return new Promise(resolve => {
    if (hasType(extQualKey, "array")) {
      let [objKey, relKey] = extQualKey;
      fetchRelationalQualityPath(objKey, relKey).then(
        qualPath => resolve(qualPath)
      );
    }
    else {
      let qualKey = extQualKey;
      fetchEntityPath(qualKey).then(qualPath => resolve(qualPath));
    }
  });
}