import {useState, createContext, useContext} from "react";

import {DBRequestManager} from "./DBRequestManager.js";
import {AccountContextProvider} from "./contexts/AccountContext.js";
import {ColumnsContext, ColumnManager} from "./contexts/ColumnsContext.js";
import {InterfaceHeader} from "./InterfaceHeader.js";
import {InterfaceMain} from "./InterfaceMain.js";
import {LoginPage, SignupPage, TutorialPage} from "./OverlayPages.js";


export const dbReqManager = new DBRequestManager();


export const SDBInterface = () => {
  const [appPage, setAppPage] = useState("home");

  return (
    <AccountContextProvider> {/* yeilds: session, accountManager.*/}
      <div>
        <InterfacePage
          setAppPage={setAppPage}
          style={appPage === "home" ? {} : {display: "none"}}
        />
        <LoginPage
          setAppPage={setAppPage}
          style={{backgroundColor: "black"}}
        />
        <SignupPage
          setAppPage={setAppPage}
          style={appPage === "signup" ? {} : {display: "none"}}
        />
        <TutorialPage
          setAppPage={setAppPage}
          style={appPage === "tutorial" ? {} : {display: "none"}}
        />
      </div>
    {/* </AppPageContext.Provider> */}
    </AccountContextProvider>
  );
};


const initColKey = JSON.stringify({entID: 10, n: 0});

const InterfacePage = ({setAppPage}) => {
  const [columns, setColumns] = useState({
    keys: [initColKey],
    fst: 0, // first visible column from the left.
    num: 1, // number of visible columns on the screen.
    focus: 0, // The column currently in focus. (TODO: Implement further.)
  });

  const columnManager = new ColumnManager(columns, setColumns);

  return (
    <ColumnsContext.Provider value={[columns, columnManager]}>
      <div>
        <InterfaceHeader
          setAppPage={setAppPage} className="interface-header"
        />
        <InterfaceMain className="interface-main" />
      </div>
    </ColumnsContext.Provider>
  );
};
