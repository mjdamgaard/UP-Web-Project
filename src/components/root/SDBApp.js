import {useState, useEffect, useMemo} from "react";
// import {
//   BrowserRouter, Routes, Route, Outlet, redirect,
//   useParams, useSearchParams,
//   useNavigate, Navigate,
//   useLocation,
// } from "react-router-dom";

import {
  useStateAndReducers, useDispatch
} from "../../contexts_and_hooks/useStateAndReducers.js"

import {
  AccountContextProvider
} from "../../contexts_and_hooks/AccountContext.js";

// import {InterfaceHeader} from "../InterfaceHeader.js";
import {MainPage, AppColumn} from "../pages/MainPage.js";
import {
  LoginPage, SignupPage, TutorialPage, InsertPage
} from "../OverlayPages.js";


export const HOME_ENTITY_ID = 12;


const appReducers = {
  key: "app",
  "SET_PAGE": ([state, props, contexts], appPage) => {
    return {...state, appPage: appPage};
  },
}

function getPageFromTop() {
  // TODO: Implement.
  return "main";
}


export const SDBApp = () => {
  // On first render of the app, get the page from the URL and use it to set
  // the initial state. 
  const [initialPage] = useMemo(() => getPageFromTop(), []);

  const [{
    appPage,

  }, dispatch, passData] = useStateAndReducers({
    appPage: initialPage,

  }, null, appReducers);

  return passData(
    <div className="sdb-interface">
      <AccountContextProvider>{/* yields: session, accountManager.*/}
        {/* <InterfaceHeader setAppPage={void(0)} /> */}
        <MainPage
          isHidden={appPage !== "main"}
        />
        <LoginPage // Todo: Make sure that the LoginPage is refreshed
        // when it is hidden.
          isHidden={appPage !== "login"}
        />
        <SignupPage
          isHidden={appPage !== "signup"}
        />
        {/* <TutorialPage
          setAppPage={setAppPage}
          isHidden={appPage !== "tutorial"}
        /> */}
        {/* TODO: Remove the following test page */}
        <InsertPage
          isHidden={appPage !== "insert"}
        />
      </AccountContextProvider>
    </div>
  );
};




// const Layout = (props) => {
//   const {children} = props;
//   return (
//     <AccountContextProvider> {/* yields: session, accountManager.*/}
//       <InterfaceHeader setAppPage={void(0)} />
//       {children}
//       {/* <Outlet /> */}
//     </AccountContextProvider>
//   );
// };

// const IndexPage = ({}) => {
//   return (
//     <Navigate replace to={"/e" + HOME_ENTITY_ID} />
//   );
// };





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





    // <BrowserRouter>
    //   <Routes>
    //     <Route path="/" element={<Layout />}>
    //       <Route index element={<IndexPage />} />
    //       <Route path="login" element={<LoginPage />} />
    //       {/* Todo: Make sure that the LoginPage is refreshed when it is
    //       hidden. */}
    //       <Route path="signup" element={<SignupPage />} />
    //       {/* <Route path="tutorial" element={<TutorialPage />} /> */}
    //       <Route path="insert" element={<InsertPage />} />
    //       <Route key={"m"} path="*" element={<MainPage key={"m"} />} />
    //       {/* Wrong paths are handled in MainPage instead of here */}
    //     </Route>
    //   </Routes>
    // </BrowserRouter>



    // <Layout>
    //   <MainPage />
    //   <LoginPage />
    //   {/* Todo: Make sure that the LoginPage is refreshed when it is
    //   hidden. */}
    //   <SignupPage />
    //   {/* <TutorialPage /> */}
    //   <InsertPage />
    // </Layout>