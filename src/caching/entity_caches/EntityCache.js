
import CombinedCache from "../CombinedCache.js";


export class EntityCache extends CombinedCache {
  constructor(lruCacheLimit, priorityCachelimit, halfTimeInSets) {
    super(lruCacheLimit, priorityCachelimit, halfTimeInSets);
  }

  get(entID) {
    return JSON.parse(super.get(entID));
  }

  set(entID, parsedEntity) {
    return super.set(entID, JSON.stringify(parsedEntity));
  }
}

// TODO: At some point we want to remove unnecessary properties of the parsed
// entities that the parsers produce. And we also want to shorten a lot of the
// property names and property values (in particular the 'type' properties,
// etc.), also making sure to change ScriptInterpreter accordingly.