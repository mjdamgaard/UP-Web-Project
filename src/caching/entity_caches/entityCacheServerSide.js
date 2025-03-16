
import {EntityCache} from "./EntityCache.js";


export const entityCacheServerSide = new EntityCache(10^5, 10^5, 1 - 10^7);