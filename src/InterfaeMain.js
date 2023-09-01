import {useState, createContext, useContext} from "react";

import {ColumnsContext} from "/src/contexts/ColumnsContext.js";


const InterfaceMain = () => {
  const [columns, columnManager] = useContext(ColumnsContext);

  let fst = columns.fst;
  const appColumns = columns.keys.map((val, ind) => 
    <AppColumn key={val}
      style={(fst <= ind && ind < fst + columns.num) ? {} : {display: "none"}}
    />
  );
  return (
    <div>
      <div class="left-margin" onclick={columnManager.cycleLeft}>
        <br/><span>&#10094;</span><br/>
      </div>
      <div class="column-container">
        {appColumns}
      </div>
      <div class="right-margin" onclick={columnManager.cycleRight}>
        <br/><span>&#10095;</span><br/>
      </div>
    </div>
  );
};







// TODO: Correct:

const AppColumn = ({children}) => {
  return (
    <div>
      <ColumnButtonContainer />
      {children}
    </div>
  );
};
appColumnCL.addCallback("data", function(data) {
  data.copyFromAncestor("cl", 1);
  data.cl ??= appColumnCL.getRelatedCL("EntityPage");;
  data.recLevel = null;
  data.maxRecLevel = null;
});



const ColumnButtonContainer = () => {
  return (
    <div>
      {/* <PinButton /> */}
      <CloseButton />
    </div>
  );
};
const CloseButton = () => {
  return (
    <button type="button" class="close">
      <span>&times;</span>
    </button>
  );
};
closeButtonCL.addCallback(function($ci) {
  $ci.on("click", function() {
    $(this).trigger("close");
    return false;
  });
});
