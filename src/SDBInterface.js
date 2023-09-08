import {useState, createContext, useContext} from "react";

import {AccountContextProvider} from "./contexts/AccountContext.js";
import {ColumnListContext, ColumnListManager} from "./contexts/ColumnListContext.js";
import {InterfaceHeader} from "./InterfaceHeader.js";
import {InterfaceMain} from "./InterfaceMain.js";
import {LoginPage, SignupPage, TutorialPage} from "./OverlayPages.js";



export const SDBInterface = () => {
  const [appPage, setAppPage] = useState("home");

  return (
    <AccountContextProvider> {/* yeilds: session, accountManager.*/}
      <div className="sdb-interface">
        <InterfacePage
          setAppPage={setAppPage}
          isHidden={appPage !== "home"}
        />
        <LoginPage // Todo: Make sure that the LoginPage is refreshed when it is
        // hidden.
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

  const columnManager = new ColumnListManager(columns, setColumns);

  return (
    <ColumnListContext.Provider value={[columns, columnManager]}>
      <div className="interface-page"
        style={{display: isHidden ? "none" : ""}}
      >
        <InterfaceHeader setAppPage={setAppPage} />
        <InterfaceMain />
      </div>
    </ColumnListContext.Provider>
  );
};
