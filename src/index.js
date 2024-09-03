import React from 'react';
import ReactDOM from 'react-dom/client';

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";


import {SDBInterface} from './components/root/SDBInterface.js';

import './style/style01.scss';
import './style/entity_titles/title_style01.scss';



const router = createBrowserRouter([
  {
    path: "/*",
    element: <SDBInterface />,
  },
]);


const myElement = (
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(myElement);
