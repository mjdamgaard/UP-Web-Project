
import homePath from "./.id.js";
import {fetch} from 'query';
import {getUserEntPath} from "/1/1/entities.js";


const APP_NAME = "Hello World app";
const GITHUB_REPO_URL = "URL_TO_YOUR_GITHUB_REPO";
const USE_FULL_SCREEN = false;


function fetchCreatorEntPath() {
  return new Promise(resolve => {
    fetch(homePath + "./creator").then(
      creatorID => resolve(getUserEntPath("1", creatorID))
    );
  })
}



export const app = {
  "Class": "/1/1/em1.js;get/components",
  "Name": APP_NAME,
  "Component path": abs("./main.jsx"),
  "Example component path": undefined,
  "Use full screen": USE_FULL_SCREEN,
  "GitHub repository": GITHUB_REPO_URL,
  "Creator(s)": fetchCreatorEntPath(),
  "Description": abs("./em.js;get/appDescription"),
};


export const appDescription = <div>
  <h1>{APP_NAME}</h1>
  <section>
    <p>{
      "This app does not have a description yet."
    }</p>
  </section>
</div>;


