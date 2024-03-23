import {useState, useEffect, useMemo, useContext} from "react";
// import {AccountManagerContext} from "./contexts/AccountContext.js";
import {useQuery} from "./DBRequests.js";

// import {EntListHeader} from "./EntListHeader.js";
import {EntListContainer} from "./EntListContainer.js";
import {GeneralEntityElement} from "./EntityElements.js";
import {EntListGenerator} from "./EntListGenerator.js";



/* Placeholders */
const RelevantCategoriesDropdownMenuButton = () => <template></template>;
const UpdateButton = () => <template></template>;
const AddCombinerButton = () => <template></template>;


 

export const EntListDisplay = ({
  listGenerator, ElemComponent, extraProps, // headerIsExpanded
}) => {
  ElemComponent ??= GeneralEntityElement;
  const [lg, setLG] = useState(listGenerator);
  const [nonce, setNonce] = useState(0); // Used to force re-render.
  const setLGAndRerender = y => {
    setLG(y);
    setNonce(nonce + 1);
  };
  const [entList, setEntList] = useState(null);

  useMemo(() => {
    lg.generateEntList(null, (obj, combList) => {
      setEntList(combList);
    });
  }, [lg, nonce]); // (Without nonce here, function is not called again.)


  return (
    <div className="ent-list-display">
      <EntListHeader lg={lg} setLG={setLGAndRerender}
        // startAsExpanded={headerIsExpanded}
      />
      <EntListContainer
        entList={entList} lg={lg} setLG={setLGAndRerender}
        ElemComponent={ElemComponent} extraProps={extraProps}
      />
    </div>
  );
};



export const EntListHeader = ({lg, update}) => {
  return (
    <div className="ent-list-header">
      <span>
        <ListGeneratorLink lg={lg} update={update} />
        <RelevantCategoriesDropdownMenuButton lg={lg} />
        <UpdateButton update={update} />
        <AddCombinerButton lg={lg} />
      </span>
    </div>
  );
};


export const ListGeneratorLink = ({lg, update}) => {
  return (
    <span>
      {/* TODO: make a link to open a new column for the list generator. */}
    </span>
  );
};