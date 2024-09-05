import {useState, useEffect, createContext, useContext, useMemo} from "react";
import {
  BrowserRouter, Routes, Route, Outlet, redirect,
  useParams, useSearchParams,
  useNavigate, Navigate,
} from "react-router-dom";

import {AccountContextProvider} from "../../contexts/AccountContext.js";
import {ColumnListContextProvider, ColumnListManager}
  from "../../contexts/ColumnContext.js";

import {InterfaceHeader} from "../InterfaceHeader.js";
import {InterfaceMain} from "../InterfaceMain.js";
import {
  LoginPage, SignupPage, TutorialPage, InsertPage
} from "../OverlayPages.js";


export const HOME_ENTITY_ID = 12;


export const SDBApp = () => {
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<IndexPage />} />
          <Route path="login" element={<LoginPage />} />
          {/* Todo: Make sure that the LoginPage is refreshed when it is
          hidden. */}
          <Route path="signup" element={<SignupPage />} />
          {/* <Route path="tutorial" element={<TutorialPage />} /> */}
          <Route path="insert" element={<InsertPage />} />
          <Route path="*" element={<InterfacePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};



const Layout = ({}) => {
  return (
    <AccountContextProvider> {/* yields: session, accountManager.*/}
      <Outlet />
    </AccountContextProvider>
  );
};

const IndexPage = ({}) => {
  return (
    <Navigate replace to={"/e12"} />
  );
};



const InterfacePage = ({}) => {
  const pathname = useParams()["*"];
  const search = useSearchParams()[0];

  var entID = HOME_ENTITY_ID;
  if (pathname) {
    entID = (pathname.match(/^e[1-9][0-9]*/)[0] ?? "e" + entID).substring(1);
  }

  return (
    <ColumnListContextProvider initColSpec={{entID: entID}}>
      <div className="interface-page"
        // style={{display: isHidden ? "none" : ""}}
      >
        <InterfaceHeader setAppPage={void(0)} />
        <InterfaceMain />
      </div>
    </ColumnListContextProvider>
  );
};



// <AccountContextProvider> {/* yields: session, accountManager.*/}
// <div className="sdb-interface">
//   <InterfacePage
//     // initColSpec={{entID: 1}}
//     // initColSpec={{entID: 40}}
//     initColSpec={{entID: entID}} 
//     setAppPage={setAppPage}
//     isHidden={appPage !== "home"}
//   />
//   <LoginPage // Todo: Make sure that the LoginPage is refreshed when it is
//   // hidden.
//     setAppPage={setAppPage}
//     isHidden={appPage !== "login"}
//   />
//   <SignupPage
//     setAppPage={setAppPage}
//     isHidden={appPage !== "signup"}
//   />
//   {/* <TutorialPage
//     setAppPage={setAppPage}
//     isHidden={appPage !== "tutorial"}
//   /> */}
//   {/* TODO: Remove the following test page */}
//   <InsertPage
//     setAppPage={setAppPage}
//     isHidden={appPage !== "insert"}
//   />
// </div>
// {/* </AppPageContext.Provider> */}
// </AccountContextProvider>

