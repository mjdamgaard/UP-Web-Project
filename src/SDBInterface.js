import {useState, createContext, useContext, useMemo} from "react";
import {AccountContextProvider} from "./contexts/AccountContext.js";
import {ColumnListContextProvider, ColumnListManager}
  from "./contexts/ColumnContext.js";

import {InterfaceHeader} from "./InterfaceHeader.js";
import {InterfaceMain} from "./InterfaceMain.js";
import {LoginPage, SignupPage, TutorialPage} from "./OverlayPages.js";



export const SDBInterface = () => {
  const [appPage, setAppPage] = useState("home");

  return (
    <AccountContextProvider> {/* yields: session, accountManager.*/}
      <div className="sdb-interface">
        <InterfacePage
          initColKey={JSON.stringify({entID: 10, n: 0})}
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


const InterfacePage = ({initColKey, setAppPage, isHidden}) => {
  return (
    <ColumnListContextProvider initColKey={initColKey}>
      <div className="interface-page"
        style={{display: isHidden ? "none" : ""}}
      >
        <InterfaceHeader setAppPage={setAppPage} />
        <InterfaceMain />
      </div>
    </ColumnListContextProvider>
  );
};
