import {useState, createContext, useContext, useMemo} from "react";
import {useParams, useSearchParams} from "react-router-dom";

import {AccountContextProvider} from "../../contexts/AccountContext.js";
import {ColumnListContextProvider, ColumnListManager}
  from "../../contexts/ColumnContext.js";

import {InterfaceHeader} from "../InterfaceHeader.js";
import {InterfaceMain} from "../InterfaceMain.js";
import {
  LoginPage, SignupPage, TutorialPage, InsertPage
} from "../OverlayPages.js";


export const HOME_ENTITY_ID = 12;


export const SDBInterface = () => {
  const pathname = useParams()["*"];
  const search = useSearchParams()[0].toString();
  const [appPage, setAppPage] = useState("home");

  var entID = HOME_ENTITY_ID;
  if (pathname) {
    entID = (search.match(/^e\/[1-9][0-9]*/)[0] ?? "e/" + entID).substring(2);
  }

  return (
    <AccountContextProvider> {/* yields: session, accountManager.*/}
      <div className="sdb-interface">
        <InterfacePage
          // initColSpec={{entID: 1}}
          // initColSpec={{entID: 40}}
          initColSpec={{entID: entID}} 
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
        {/* <TutorialPage
          setAppPage={setAppPage}
          isHidden={appPage !== "tutorial"}
        /> */}
        {/* TODO: Remove the following test page */}
        <InsertPage
          setAppPage={setAppPage}
          isHidden={appPage !== "insert"}
        />
      </div>
    {/* </AppPageContext.Provider> */}
    </AccountContextProvider>
  );
};


const InterfacePage = ({initColSpec, setAppPage, isHidden}) => {
  return (
    <ColumnListContextProvider initColSpec={initColSpec}>
      <div className="interface-page"
        style={{display: isHidden ? "none" : ""}}
      >
        <InterfaceHeader setAppPage={setAppPage} />
        <InterfaceMain />
      </div>
    </ColumnListContextProvider>
  );
};
