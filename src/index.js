import React from 'react';
import ReactDOM from 'react-dom/client';

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";


import {SDBInterface} from './components/root/SDBInterface.js';

import './style/style01.css';



const router = createBrowserRouter([
  {
    path: "/*",
    element: <SDBInterface key={0} />,
  },
]);


const myElement = (
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(myElement);
