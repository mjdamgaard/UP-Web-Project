

export const sharedBuiltInFunctions = {

  getStructModuleIDs: () => new BuiltInFunction(
    function (_, structDef) {
      let secondAttributeStr = (structDef.match(/[^,]+/g) ?? [])[1];
      return secondAttributeStr.match(/[1-9][0-9]*/g) ?? [];
    },
    {comp: 1}
  ),
}