import React from 'react';
import ReactDOM from 'react-dom/client';

// import {
//   BrowserRouter, Routes,
//   createBrowserRouter,
//   RouterProvider,
// } from "react-router-dom";


import {App} from './components/root/App.js';

import './style/style01.scss';
import './style/entity_titles/title_style.scss';
import './style/entity_data/entity_data_style.scss';



// const router = createBrowserRouter([
//   {
//     path: "/*",
//     element: <SDBApp />,
//   },
// ]);


const myElement = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

const root = ReactDOM.createRoot(document.getElementById('root'), {
  // identifierPrefix: '',
});
root.render(myElement);
