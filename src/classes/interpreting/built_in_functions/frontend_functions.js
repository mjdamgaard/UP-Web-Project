
import {sharedBuiltInFunctions} from "./shared_functions.js";


export const frontendBuiltInFunctions = {
  ...sharedBuiltInFunctions,

  fetchStructDef: () => new BuiltInFunction(
    function (_, structID) {
      
    },
    {comp: 1}
  ),

  fetchScript: () => new BuiltInFunction(
    function (_, scriptID) {
      
    },
    {comp: 1}
  ),
}