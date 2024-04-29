import React from 'react';
import ReactDOM from 'react-dom/client';

import {SDBInterface} from './components/SDBInterface.js';

import './style/style01.css';

const myElement = (
  <React.StrictMode>
    <SDBInterface />
  </React.StrictMode>
);



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(myElement);
