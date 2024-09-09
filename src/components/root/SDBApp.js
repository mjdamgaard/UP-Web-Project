import {useState, useEffect, useMemo} from "react";
import {
  BrowserRouter, Routes, Route, Outlet, redirect,
  useParams, useSearchParams,
  useNavigate, Navigate,
  useLocation,
} from "react-router-dom";

import {AccountContextProvider} from "../../contexts_and_hooks/AccountContext.js";
import {SessionStateContextProvider}
  from "../../contexts_and_hooks/SessionStateContext.js";

import {InterfaceHeader} from "../InterfaceHeader.js";
import {MainPage, AppColumn} from "../pages/MainPage.js";
import {
  LoginPage, SignupPage, TutorialPage, InsertPage
} from "../OverlayPages.js";


export const HOME_ENTITY_ID = 12;


export const SDBApp = () => {
  
  return (
    <SessionStateContextProvider>
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
            <Route path="*" element={<MainPage />} />
            {/* Wrong paths are handled in MainPage instead of here */}
          </Route>
        </Routes>
      </BrowserRouter>
    </SessionStateContextProvider>
  );
};




const Layout = ({}) => {
  return (
    <AccountContextProvider> {/* yields: session, accountManager.*/}
      <InterfaceHeader setAppPage={void(0)} />
      <Outlet />
    </AccountContextProvider>
  );
};

const IndexPage = ({}) => {
  return (
    <Navigate replace to={"/e" + HOME_ENTITY_ID} />
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

