import {useState, createContext, useContext} from "react";

import {AccountContextProvider} from "./contexts/AccountContext.js";
import {ColumnsContext, ColumnManager} from "./contexts/ColumnsContext.js";
import {InterfaceHeader} from "./InterfaceHeader.js";
import {InterfaceMain} from "./InterfaceMain.js";
import {LoginPage, SignupPage, TutorialPage} from "./OverlayPages.js";



export const SDBInterface = () => {
  const [appPage, setAppPage] = useState("home");debugger;

  return (
    <AccountContextProvider> {/* yeilds: session, accountManager.*/}
      <div className="sdb-interface">
        <InterfacePage
          setAppPage={setAppPage}
          isHidden={appPage !== "home"}
        />
        <LoginPage
          setAppPage={setAppPage}
          isHidden={appPage !== "login"}
        />
        <SignupPage
          setAppPage={setAppPage}
          isHidden={appPage !== "signup"}
        />
        <TutorialPage
          setAppPage={setAppPage}
          isHidden={appPage !== "tutorial"}
        />
      </div>
    {/* </AppPageContext.Provider> */}
    </AccountContextProvider>
  );
};


const initColKey = JSON.stringify({entID: 10, n: 0});

const InterfacePage = ({setAppPage, isHidden}) => {
  const [columns, setColumns] = useState({
    keys: [initColKey],
    fst: 0, // first visible column from the left.
    num: 1, // number of visible columns on the screen.
    focus: 0, // The column currently in focus. (TODO: Implement further.)
  });

  const columnManager = new ColumnManager(columns, setColumns);

  return (
    <ColumnsContext.Provider value={[columns, columnManager]}>
      <div className="interface-page"
        style={{display: isHidden ? "none" : "block"}}
      >
        <InterfaceHeader setAppPage={setAppPage} />
        <InterfaceMain />
      </div>
    </ColumnsContext.Provider>
  );
};
