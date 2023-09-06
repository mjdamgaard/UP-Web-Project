import React from 'react';
import ReactDOM from 'react-dom/client';

import {SDBInterface} from './SDBInterface.js';

import './style/style01.css';

const myElement = (
  <SDBInterface className="sdb-interface"/>
);



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(myElement);
