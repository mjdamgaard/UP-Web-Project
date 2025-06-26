
import {loginServerDomainURL} from "../server/config.js";


export function main() {
  // Determine whether the user is logged in or not (automatically treating the
  // user as logged out if the user session expires within a day). and set a
  // CSS class on #above-app-menu depending on this.
  let {expTime} = JSON.parse(localStorage.getItem("userData") ?? "{}");

  if (!expTime || expTime < Date.now() + 86400000) {
    localStorage.removeItem("userData");
    document.getElementById("above-app-menu").classList.add(".logged-out");
  }
  else {
    document.getElementById("above-app-menu").classList.add(".logged-in");
  }

  // Add onclick events to the account settings menu items.
  document.getElementById("logout-item").onclick = logout;
  document.getElementById("login-item").onclick = openLoginPage;
  document.getElementById("create-account-item").onclick =
    openCreateAccountPage;

}



function logout() {
  let {userID, authToken, expTime} = JSON.parse(
    localStorage.getItem("userData") ?? "{}"
  );
  localStorage.removeItem("userData");
  if (expTime < Date.now() + 5000) {
    let options = {
      method: "POST",
      headers: {Authorization: `Bearer ${authToken}`},
      body: userID,
    };
    fetch(loginServerDomainURL + "/logout", options).catch(err => {
      console.error(
        `An error occurred when logging out: "${err.toString()}"`
      );
    });
  }
  let aboveAppMenu = document.getElementById("above-app-menu");
  aboveAppMenu.classList.remove(".logged-in");
  aboveAppMenu.classList.add(".logged-out");
}



function openLoginPage() {

}



function openCreateAccountPage() {

}