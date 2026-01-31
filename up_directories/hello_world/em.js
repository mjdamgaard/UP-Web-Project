
import homePath from "./.id.js";
import {fetch} from 'query';
import {getUserEntPath} from "/1/1/entities.js";


const APP_NAME = "YOUR_APP_NAME";
const COMPONENT_PATH = "./app1.jsx";
const GITHUB_REPO_URL = "URL_TO_YOUR_GITHUB_REPO";
const NO_MARGINS = false;
const NO_HEADER = false;



export const app = {
  "Class": "/1/1/em1.js;get/components",
  "Name": APP_NAME,
  "Component path": abs(COMPONENT_PATH),
  "Example component path": undefined,
  "No margins": NO_MARGINS,
  "No header": NO_HEADER,
  "GitHub repository": GITHUB_REPO_URL,
  "Creator(s)": () => fetchCreatorEntPath(),
  "Description": abs("./em.js;get/appDescription"),
};


export const appDescription = <div>
  <h1>{APP_NAME}</h1>
  <section>
    <p>
      This app does not have a description yet.
    </p>
  </section>
</div>;




function fetchCreatorEntPath() {
  return new Promise(resolve => {
    fetch(homePath + "./creator").then(
      creatorID => resolve(getUserEntPath("1", creatorID))
    );
  })
}
