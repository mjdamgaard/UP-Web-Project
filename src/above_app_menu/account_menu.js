
import {loginServerDomainURL} from "../server/config.js";


export function main() {
  // Determine whether the user is logged in or not (automatically treating the
  // user as logged out if the user session expires within a day). and set a
  // CSS class on #account-menu depending on this.
  let {expTime} = JSON.parse(localStorage.getItem("userData") ?? "{}");

  if (!expTime || expTime < Date.now() + 86400000) {
    localStorage.removeItem("userData");
    document.getElementById("account-menu").classList.add(".logged-out");
  }
  else {
    document.getElementById("account-menu").classList.add(".logged-in");
  }

  // Add onclick events open and close the account menu.
  document.getElementById("account-menu-header").onclick = () => {
    document.getElementById("account-menu").classList.add("open");
    document.getElementById("up-app-root").onclick = () => {
      document.getElementById("account-menu").classList.remove("open");
      document.getElementById("up-app-root").onclick = undefined;
    };

  }; 

  // Add onclick events to the account menu items.
  document.getElementById("logout-item").onclick = logout;
  document.getElementById("login-item").onclick = () => {
      document.getElementById("account-menu").classList.remove("open");
      openLoginPage();
  };
  document.getElementById("create-account-item").onclick = () => {
      document.getElementById("account-menu").classList.remove("open");
      openCreateAccountPage();
  };
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
    fetch(
      loginServerDomainURL + "/logout", options
    ).catch(err => {
      console.error(`An error occurred when logging out: "${err.toString()}"`);
    }).then(() => {
      let accountMenu = document.getElementById("account-menu");
      accountMenu.classList.remove("open");
      accountMenu.classList.remove("logged-in");
      accountMenu.classList.add("logged-out");
    });
  }
}



function openLoginPage() {
  let overlayPageContainer = document.getElementById("overlay-page-container");
  overlayPageContainer.classList.add("open");
  overlayPageContainer.innerHTML = `
    <div class="go-back-button">&#10094;</div>
    <div class="page-content">
      <h3>Log in</h3>
      <form action="javascript:void(0);">
        <div class="form-group">
          <label>Username</label>
          <input type="text" class="form-control username"></input>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" class="form-control password"></input>
        </div>
        <button type="submit" class="btn btn-primary">
          Log in
        </button>
      </form>
      <div class="response-display text-warning"></div>
    </div>
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
      responseDisplay.replaceChildren(errMsg);
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
      responseDisplay.replaceChildren(err.toString());
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
    <div class="page-content">
      <h3>Create a new account</h3>
      <form action="javascript:void(0);">
        <div class="form-group">
          <label>Username</label>
          <input type="text" class="form-control username"></input>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" class="form-control password"></input>
        </div>
        <div class="form-group">
          <label>E-mail</label>
          <input type="email" class="form-control email"></input>
        </div>
        <button type="submit" class="btn btn-primary">
          Create account
        </button>
      </form>
      <div class="response-display text-warning"></div>
    </div>
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
      responseDisplay.replaceChildren(errMsg);
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
      responseDisplay.replaceChildren(err.toString());
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
  if (!username || !/^[a-zA-Z][a-zA-Z0-9_-]{3,39}$/.test(username)) {
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
