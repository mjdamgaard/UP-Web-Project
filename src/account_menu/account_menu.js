
import {ServerQueryHandler} from "../server/ajax_io/ServerQueryHandler.js";

const serverQueryHandler = new ServerQueryHandler();

const EMAIL_REGEX = /^[a-zA-Z][a-zA-Z0-9.\-_]*@[a-zA-Z][a-zA-Z0-9.\-_]*$/;



export function main(settingsContext, urlContext) {
  // Determine whether the user is logged in or not (automatically treating the
  // user as logged out if the user session expires within a day). and set a
  // CSS class on #account-menu depending on this.
  let {userID, username, expTime} =
    JSON.parse(localStorage.getItem("userData") ?? "{}");
  settingsContext.update(settings => settings.changeUser(userID));

  if (!expTime || expTime * 1000 < Date.now() + 86400000) {
    localStorage.removeItem("userData");
    username = "";
  }
  else {
    document.getElementById("account-menu").classList.add("logged-in");
    document.getElementById("user-name-display").replaceChildren(username);

    // Also send a request to place the token if the expTime is close enough to
    // the present.
    if (expTime * 1000 < Date.now() + 2678400000) {
      let {authToken, userID} =
        JSON.parse(localStorage.getItem("userData") ?? "{}");
      queryLoginServer(
        "replaceToken", undefined, {authToken: authToken}
      ).then(res => {
        let [newAuthToken, expTime] = res;
        localStorage.setItem("userData", JSON.stringify({
          userID: userID, username: username,
          authToken: newAuthToken, expTime: expTime,
        }));
      }).catch(err => {
        console.error(err);
      });
    }
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
  document.getElementById("logout-item").onclick = () => {
      logout(settingsContext, urlContext);
  };
  document.getElementById("login-item").onclick = () => {
      document.getElementById("account-menu").classList.remove("open");
      openLoginPage(settingsContext, urlContext);
  };
  document.getElementById("create-account-item").onclick = () => {
      document.getElementById("account-menu").classList.remove("open");
      openCreateAccountPage(settingsContext, urlContext);
  };
  document.getElementById("account-page-item").onclick = () => {
      goToAccountPage(settingsContext, urlContext);
  };
  document.getElementById("profile-page-item").onclick = () => {
      goToProfilePage(settingsContext, urlContext);
  };
}



function logout(settingsContext) {
  let {userID, authToken} = JSON.parse(
    localStorage.getItem("userData") ?? "{}"
  );
  queryLoginServer(
    "logout", userID, {authToken: authToken}
  ).then(() => {
    localStorage.clear();
    settingsContext.update(settings => settings.changeUser(undefined));
    document.getElementById("user-name-display").replaceChildren("");
    let accountMenu = document.getElementById("account-menu");
    accountMenu.classList.remove("open");
    accountMenu.classList.remove("logged-in");
  }).catch(err => {
    console.error(`An error occurred when logging out: "${err.toString()}"`);
  });
}



function openLoginPage(settingsContext) {
  let overlayPageContainer = document.getElementById("overlay-page-container");
  overlayPageContainer.classList.add("open");
  overlayPageContainer.innerHTML = `
    <div class="go-back-button"></div>
    <div class="page-content">
      <h2>Log in</h2>
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
    document.getElementById("up-app-root").click();
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
    queryLoginServer(
      "login", undefined, {username: username, password: password}
    ).then(res => {
      let [userID, authToken, expTime] = res;
      if (!userID) {
        responseDisplay.replaceChildren("Incorrect password");
        return;
      }
      settingsContext.update(settings => settings.changeUser(userID));
      localStorage.setItem("userData", JSON.stringify({
        userID: userID, username: username,
        authToken: authToken, expTime: expTime,
      }));
      document.getElementById("account-menu").classList.add("logged-in");
      document.getElementById("user-name-display").replaceChildren(username);
      overlayPageContainer.classList.remove("open");
      overlayPageContainer.innerHTML = "";
    }).catch(err => {
      responseDisplay.replaceChildren(err.toString());
    });
  };
}



function openCreateAccountPage(settingsContext) {
  let overlayPageContainer = document.getElementById("overlay-page-container");
  overlayPageContainer.classList.add("open");
  overlayPageContainer.innerHTML = `
    <div class="go-back-button"></div>
    <div class="page-content">
      <h2>Create a new account</h2>
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
          <label>E-mail (not required)</label>
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
    document.getElementById("up-app-root").click();
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
    queryLoginServer(
      "createAccount", email, {username: username, password: password}
    ).then(res => {
      let [userID, authToken, expTime] = res;
      if (!userID) {
        responseDisplay.replaceChildren("Username already exists");
        return;
      }
      settingsContext.update(settings => settings.changeUser(userID));
      localStorage.setItem("userData", JSON.stringify({
        userID: userID, username: username,
        authToken: authToken, expTime: expTime,
      }));
      document.getElementById("account-menu").classList.add("logged-in");
      document.getElementById("user-name-display").replaceChildren(username);
      overlayPageContainer.classList.remove("open");
      overlayPageContainer.innerHTML = "";
    }).catch(err => {
      responseDisplay.replaceChildren(err.toString());
    });
  };

}



function goToAccountPage() {
  let overlayPageContainer = document.getElementById("overlay-page-container");
  overlayPageContainer.classList.add("open");
  overlayPageContainer.innerHTML = `
    <div class="go-back-button"></div>
    <div class="page-content">
      <h2>My account</h2>
      <h4>User info</h4>
      <dl class="user-info-list">
          <dt>Username</dt><dd></dd>
          <dt>User ID</dt><dd></dd>
      </dl>
      <h4>User gas reserve</h4>
      <dl class="user-gas-list">
          <dt>Computation gas</dt><dd></dd>
          <dt>DB reading gas</dt><dd></dd>
          <dt>DB writing gas</dt><dd></dd>
          <dt>Directory creation gas</dt><dd></dd>
          <dt>DB table creation gas</dt><dd></dd>
          <dt>Time gas</dt><dd></dd>
          <dt>Connection gas</dt><dd></dd>
          <dt>Fetching gas</dt><dd></dd>
      </dl>
    </div>
  `;
  let goBackButton = overlayPageContainer.querySelector(".go-back-button");
  goBackButton.onclick = () => {
    overlayPageContainer.classList.remove("open");
    overlayPageContainer.innerHTML = "";
    document.getElementById("up-app-root").click();
  };
  let {username, userID, authToken} = JSON.parse(
    localStorage.getItem("userData") ?? "{}"
  );
  let userInfoList = overlayPageContainer.querySelector(".user-info-list");
  userInfoList.querySelector("dd:nth-of-type(1)").replaceChildren(username);
  userInfoList.querySelector("dd:nth-of-type(2)").replaceChildren(userID);
  queryLoginServer(
    "userIDAndGas", undefined, {authToken: authToken}
  ).then(res => {
    let [ , gas] = res;
    if (!gas) {
      console.error("userIDAndGas request failed");
      return;
    }
    let userGasList = overlayPageContainer.querySelector(".user-gas-list");
    userGasList.querySelector("dd:nth-of-type(1)").replaceChildren(gas.comp);
    userGasList.querySelector("dd:nth-of-type(2)").replaceChildren(gas.dbRead);
    userGasList.querySelector("dd:nth-of-type(3)").replaceChildren(gas.dbWrite);
    userGasList.querySelector("dd:nth-of-type(4)").replaceChildren(gas.mkdir);
    userGasList.querySelector("dd:nth-of-type(5)").replaceChildren(gas.mkTable);
    userGasList.querySelector("dd:nth-of-type(6)").replaceChildren(gas.time);
    userGasList.querySelector("dd:nth-of-type(7)").replaceChildren(gas.conn);
    userGasList.querySelector("dd:nth-of-type(8)").replaceChildren(gas.fetch);
  }).catch(err => {
    console.error("userIDAndGas request failed with error:");
    console.error(err);
    return;
  });
}


function goToProfilePage(_, urlContext) {
  document.getElementById("up-app-root").click();
  let url = "/profile", stateJSON = 'null';
  let urlData = {url: url, stateJSON: stateJSON};
  urlContext.setVal(urlData);
  window.history.pushState(null, "", "/profile");
}




async function queryLoginServer(reqType, reqBody, authOptions) {
  return await serverQueryHandler.queryLoginServer(
    reqType, reqBody, authOptions
  );
}






export function validateUsernamePWAndEmailFormats(
  username, password, emailAddr = ""
) {
  if (!username || !/^[a-zA-Z][a-zA-Z0-9_-]{3,39}$/.test(username)) {
    return "Invalid username";
  }
  if (!password || password.length < 8 || password.length > 120) {
    return "Password not long enough";
  }
  if (emailAddr && !EMAIL_REGEX.test(emailAddr)) {
    return "Invalid e-mail address";
  }
}
