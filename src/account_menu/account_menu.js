
import {loginServerDomainURL} from "../server/config.js";


export function main(settingsContext) {
  // Determine whether the user is logged in or not (automatically treating the
  // user as logged out if the user session expires within a day). and set a
  // CSS class on #account-menu depending on this.
  let {userID, username, expTime} =
    JSON.parse(localStorage.getItem("userData") ?? "{}");
  settingsContext.setMember("userID", userID);

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
      requestLoginServer(
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
      logout(settingsContext);
  };
  document.getElementById("login-item").onclick = () => {
      document.getElementById("account-menu").classList.remove("open");
      openLoginPage(settingsContext);
  };
  document.getElementById("create-account-item").onclick = () => {
      document.getElementById("account-menu").classList.remove("open");
      openCreateAccountPage(settingsContext);
  };
  document.getElementById("account-page-item").onclick = () => {
      goToAccountPage(settingsContext);
  };
}



function logout(settingsContext) {
  let {userID, authToken} = JSON.parse(
    localStorage.getItem("userData") ?? "{}"
  );
  requestLoginServer(
    "logout", userID, {authToken: authToken}
  ).then(() => {
    localStorage.removeItem("userData");
    settingsContext.setMember("userID", undefined);
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
    requestLoginServer(
      "login", undefined, {username: username, password: password}
    ).then(res => {
      let [userID, authToken, expTime] = res;
      if (!userID) {
        responseDisplay.replaceChildren("Incorrect password");
        return;
      }
      settingsContext.setMember("userID", userID);
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
    requestLoginServer(
      "createAccount", email, {username: username, password: password}
    ).then(res => {
      let [userID, authToken, expTime] = res;
      if (!userID) {
        responseDisplay.replaceChildren("Username already exists");
        return;
      }
      settingsContext.setMember("userID", userID);
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



function goToAccountPage(settingsContext) {
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
  requestLoginServer(
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





export async function requestLoginServer(reqType, reqBody, authOptions) {
  let url = loginServerDomainURL + "/" + reqType;
  let headers = authOptions?.authToken ? {
    Authorization: `Bearer ${authOptions.authToken}`
  } : authOptions?.username ? {
    Authorization:
      `Basic ${btoa(`${authOptions.username}:${authOptions.password}`)}`
  } : {};
  return await request(url, true, reqBody, headers);
}



export async function request(url, isPost, reqBody, headers) {
    // Send the request.
    let options = isPost ? {
      method: "POST",
      headers: headers,
      body: reqBody,
    } : {
      headers: headers,
    };
    let response;
    try {
      response = await fetch(url, options);
    } catch (err) {
      if (err instanceof TypeError) {
        throw new err.message;
      }
      else throw err;
    }
    let responseText = await response.text();


    if (!response.ok) {
      // TODO: Consider changing the name of LoadError, and/or making a new
      // error type for server request errors.
      throw new NetworkError(
        "HTTP error " + response.status +
        (responseText ? ": " + responseText : ""),
      );
    }
    else {
      let mimeType = response.headers.get("Content-Type");
      return fromMIMEType(responseText, mimeType);
    }
  }


  export class NetworkError {
    constructor(msg) {
      this.msg = msg;
    }
    toString() {
      return this.msg; 
    }
  }


  function fromMIMEType(val, mimeType) {
    if (mimeType === "text/plain") {
      return val;
    }
    else if (mimeType === "application/json") {
      try {
        return JSON.parse(val);
      } catch(err) {
        throw "Invalid application/json data received from server";
      }
    }
    else throw (
      `fromMIMEType(): Unrecognized/un-implemented MIME type: ${mimeType}`
    );
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
