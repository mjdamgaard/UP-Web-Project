
import {getUserEntPath} from "./entities.js";


export const webApps = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Web apps",
  "Superclass": abs("./em1.js;get/components"),
  "Description": abs("./em2.js;get/webAppsDesc"),
};

export const webAppsDesc = <div>
  <h1>{"Web apps"}</h1>
  <section>
    <p>{
      "This is a class of all components that can be used as the root " +
      "components for a user-programmed website."
    }</p>
    <p>{
      "Note that unlike certain other component classes, up-rating a " +
      "component to the top of this class will not automatically change the " +
      "appearance of this website. But if the devs agree that a newly top-" +
      "rated app is better than the current one, they might choose to make " +
      "the replacement."
    }</p>
    <p>{
      "This class can thus be uses as a way to make suggestions for " +
      "improvements on the root component of the website."
    }</p>
  </section>
</div>;


export const homeApp = {
  "Class": abs("./em1.js;get/components"),
  "Name": "Home app",
  "Component path": "/1/2/main.jsx",
  "Example component path": undefined,
  "Use full screen": true,
  "GitHub repository":
    "https://github.com/mjdamgaard/UP-Web-Project/tree/main/" +
    "dir_uploads/up_directories/home_app",
  "Author(s)": getUserEntPath("1", "1"),
  "Description": undefined,
};





export const indexPages = {
  "Class": abs("./em1.js;get/classes"),
  "Name": "Index pages",
  "Superclass": abs("./em1.js;get/components"),
  "Description": abs("./em2.js;get/indexPagesDesc"),
};

export const indexPagesDesc = <div>
  <h1>{"Index pages"}</h1>
  <section>
    <p>{
      "This is a class of all components that can be used for the \"User-" +
      "programmed index page\" of this website."
    }</p>
    <p>{
      "The \"User-programmed index page\" is the page is the front page of " +
      "this website, and it also governs all URLs that starts with '/up' " +
      "after the domain. The component's job is thus to redirect to a user-" +
      "programmed page/app that fits that URL." 
    }</p>
    <p>{
      "This kind of component thus serves as the index into what we can call " +
      'an "Everything Website." The concept of an "Everything Website" is ' +
      "described in the readme of the project's GitHub folder, at " +
      "https://github.com/mjdamgaard/UP-Web-Project."
    }</p>
  </section>
</div>;


export const upIndexPage01 = {
  "Class": abs("./em1.js;get/components"),
  "Name": "Index page 1.0",
  "Component path": "/1/2/index_pages/IndexPage01.jsx",
  "Example component path": undefined,
  "GitHub repository":
    "https://github.com/mjdamgaard/UP-Web-Project/tree/main/" +
    "dir_uploads/up_directories/home_app/index_pages",
  "Author(s)": getUserEntPath("1", "1"),
  "Description": undefined,
};

export const upIndexPage02 = {
  "Class": abs("./em1.js;get/components"),
  "Name": "Example index page",
  "Component path": "/1/2/index_pages/IndexPage02.jsx",
  "Example component path": undefined,
  "GitHub repository":
    "https://github.com/mjdamgaard/UP-Web-Project/tree/main/" +
    "dir_uploads/up_directories/home_app/index_pages",
  "Author(s)": getUserEntPath("1", "1"),
  "Description": undefined,
};








export const classEntityPage = {
  "Class": abs("./em1.js;get/components"),
  "Name": "Initial class entity page",
  "Component path": "/1/2/entity_pages/ClassPage.jsx",
  "Example props": {entKey: abs("./em1.js;get/entities")},
  "GitHub repository":
    "https://github.com/mjdamgaard/UP-Web-Project/tree/main/" +
    "dir_uploads/up_directories/home_app/entity_pages",
  "Author(s)": getUserEntPath("1", "1"),
  "Description": undefined,
};

export const commentElement = {
  "Class": abs("./em1.js;get/components"),
  "Name": "Initial comment element",
  "Component path": "/1/2/entity_elements/CommentElement.jsx",
  "Example props": {entKey: abs("./em1.js;get/entities")},
  "GitHub repository":
    "https://github.com/mjdamgaard/UP-Web-Project/tree/main/" +
    "dir_uploads/up_directories/home_app/entity_pages",
  "Author(s)": getUserEntPath("1", "1"),
  "Description": undefined,
};




export const flipGame = {
  "Class": abs("./em1.js;get/components"),
  "Name": "Flip game 1.0",
  "Component path": "/1/2/tutorials/flip_game_01/FlipGame01.jsx",
  "Example props": {},
  "GitHub repository":
    "https://github.com/mjdamgaard/UP-Web-Project/tree/main/" +
    "dir_uploads/up_directories/home_app/tutorials/flip_game_01",
  "Author(s)": getUserEntPath("1", "1"),
  "Description": undefined,
};
