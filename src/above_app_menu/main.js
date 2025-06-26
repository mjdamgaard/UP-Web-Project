
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

  // Add 
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
  let overlayPageContainer = document.getElementById("overlay-page-container");
  overlayPageContainer.classList.add("open");
  overlayPageContainer.innerHTML = `
    <div class="go-back-button">&#10094;</div>
    <h3>Log in</h3>
    <form>
      <div class="form-group">
        <label>Username</label>
        <input type="text" className="form-control username"></input>
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" className="form-control password"></input>
      </div>
      <span>
        <button className="btn btn-default">
          Log in
        </button>
      </span>
    </form>
    <div class="response-display text-warning"></div>
  `;
  let goBackButton = overlayPageContainer.querySelector(".go-back-button");
  goBackButton.onclick = () => {
    overlayPageContainer.classList.remove("open");
    overlayPageContainer.innerHTML = "";
  };
  let postButton = overlayPageContainer.querySelector("form button");
  postButton.onclick = () => {
    let responseDisplay =
      overlayPageContainer.querySelector(".response-display");
    let usernameInput = overlayPageContainer.querySelector("input.username");
    let passwordInput = overlayPageContainer.querySelector("input.password");
    let username = usernameInput.value;
    let password = passwordInput.value;
    let errMsg = validateUsernamePWAndEmailFormats(username, password);
    if (errMsg) {
      responseDisplay.append(errMsg);
      return;
    }
    let credentials = btoa(`${username}:${password}`);
    let options = {
      method: "POST",
      headers: {Authorization: `Basic ${credentials}`},
    };
    fetch(
      loginServerDomainURL + "/login", options
    ).catch(err => {
      responseDisplay.append(err.toString());
    }).then(res => {
      let [userID, authToken, expTime] = JSON.parse(res);
      localStorage.setItem("userData", JSON.stringify({
        userID: userID, authToken: authToken, expTime: expTime
      }));
      overlayPageContainer.classList.remove("open");
      overlayPageContainer.innerHTML = "";
      // TODO: Also make the app component rerender with an updated userID prop.
    });
  };
}



function openCreateAccountPage() {
  let overlayPageContainer = document.getElementById("overlay-page-container");
  overlayPageContainer.classList.add("open");
  overlayPageContainer.innerHTML = `
    <div class="go-back-button">&#10094;</div>
    <h3>Create a new account</h3>
    <form>
      <div class="form-group">
        <label>Username</label>
        <input type="text" className="form-control username"></input>
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" className="form-control password"></input>
      </div>
      <div class="form-group">
        <label>E-mail</label>
        <input type="email" className="form-control email"></input>
      </div>
      <span>
        <button className="btn btn-default">
          Log in
        </button>
      </span>
    </form>
    <div class="response-display text-warning"></div>
  `;
  let goBackButton = overlayPageContainer.querySelector(".go-back-button");
  goBackButton.onclick = () => {
    overlayPageContainer.classList.remove("open");
    overlayPageContainer.innerHTML = "";
  };
  let postButton = overlayPageContainer.querySelector("form button");
  postButton.onclick = () => {
    let responseDisplay =
      overlayPageContainer.querySelector(".response-display");
    let usernameInput = overlayPageContainer.querySelector("input.username");
    let passwordInput = overlayPageContainer.querySelector("input.password");
    let emailInput = overlayPageContainer.querySelector("input.email");
    let username = usernameInput.value;
    let password = passwordInput.value;
    let email = emailInput.value ?? "";
    let errMsg = validateUsernamePWAndEmailFormats(username, password, email);
    if (errMsg) {
      responseDisplay.append(errMsg);
      return;
    }
    let credentials = btoa(`${username}:${password}`);
    let options = {
      method: "POST",
      headers: {Authorization: `Basic ${credentials}`},
      body: email,
    };
    fetch(
      loginServerDomainURL + "/createAccount", options
    ).catch(err => {
      responseDisplay.append(err.toString());
    }).then(res => {
      let [userID, authToken, expTime] = JSON.parse(res);
      localStorage.setItem("userData", JSON.stringify({
        userID: userID, authToken: authToken, expTime: expTime
      }));
      overlayPageContainer.classList.remove("open");
      overlayPageContainer.innerHTML = "";
      // TODO: Also make the app component rerender with an updated userID prop.
    });
  };

}












// TODO: This is repeated from login_server.js, so combine and move both these
// declarations into their own module. ..Well, except that I'm implementing
// them slightly but I guess the server-side one could just use this one as a
// helper function. ..Oh, but they also differ in other ways, never mind..

export function validateUsernamePWAndEmailFormats(
  username, password, emailAddr = ""
) {
  if (!username || !/^[a-zA-Z_-]{4, 40}$/.test(username)) {
    return "Invalid username";
  }
  if (!password || password.length < 8 || password.length > 120) {
    return "Password not long enough";
  }
  // TODO: Implement validation.
  if (emailAddr && !/^.$/.test(emailAddr)) {
    return "Invalid e-mail address";
  }
}
