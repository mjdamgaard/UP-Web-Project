import React from 'react';
import ReactDOM from 'react-dom/client';

// import {
//   BrowserRouter, Routes,
//   createBrowserRouter,
//   RouterProvider,
// } from "react-router-dom";


import {SDBApp} from './components/root/SDBApp.js';

import './style/style01.scss';
import './style/entity_titles/title_style01.scss';



// const router = createBrowserRouter([
//   {
//     path: "/*",
//     element: <SDBApp />,
//   },
// ]);


const myElement = (
  // <React.StrictMode>
    <SDBApp />
  // </React.StrictMode>
);

const root = ReactDOM.createRoot(document.getElementById('root'), {
  // identifierPrefix: '',
});
root.render(myElement);
