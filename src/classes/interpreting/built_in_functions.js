
import {
  payGas, decrCompGas, decrFetchGas
} from "./ScriptInterpreter.js";


export const sharedBuiltInFunctions = {

  getStructModuleIDs: function ({gas}, structDef) {
    decrCompGas(gas);
    let secondAttributeStr = (structDef.match(/[^,]+/g) ?? [])[1];
    return secondAttributeStr.match(/[1-9][0-9]*/g) ?? [];
  },

  fetchStructDef: new BuiltInFunction(
    function (_, structID) {
      
    },
    {comp: 1}
  ),

  fetchScript: new BuiltInFunction(
    function (_, scriptID) {
      
    },
    {comp: 1}
  ),
}