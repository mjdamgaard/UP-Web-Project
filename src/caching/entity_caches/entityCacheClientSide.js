
import {EntityCache} from "./EntityCache.js";


export const entityCacheClientSide = new EntityCache(10^4, 10^3, 1 - 10^4);