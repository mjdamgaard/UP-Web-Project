
import {hasType} from 'type';
import {fetchRelationalQualityPath, fetchEntityPath} from
  "~/../semantic_entities/entities.js";

export function fetchQualityKeyArray(extQualKeyArr) {
  return new Promise(resolve => {
    let qualKeyPromArr = extQualKeyArr.map(extQualKey => (
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