import React from 'react';
import ReactDOM from 'react-dom/client';

import Car from './Car.js';


const myElement = (
  <>
  <p>I am a paragraph.</p>
  <p>I am a paragraph too.</p>
  <Car color="red"/>
  </>
);



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(myElement);
