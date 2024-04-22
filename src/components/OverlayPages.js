import {useState, createContext, useContext} from "react";
import {AccountManagerContext} from "../contexts/AccountContext.js";

import {useQuery, useInput} from "../hooks/DBRequests.js";

export const OverlayPage = ({children, setAppPage, isHidden}) => {
  return (
    <div className="overlay-page"
      style={{display: isHidden ? "none" : null}}
    >
      <div className="overlay-page-margin">
        <GoBackButton setAppPage={setAppPage} />
      </div>
      <div className="content-container">
        {children}
      </div>
      <div className="overlay-page-margin"></div>
    </div>
  );
};


export const GoBackButton = ({setAppPage}) => {
  return (
    <span className="go-back-button"
      onClick={() => setAppPage("home")}
    >
      &#10094;
    </span>
  );
};

export function hasAcceptedStorage() {
  if (localStorage.hasAcceptedStorage) {
    return true;
  } else {
    if (
      window.confirm(
        'This site uses only necessary local storage (for storing ' +
        'user ID and login session data). Press OK to ' +
        'accept this and be able to log in or create an account.'
      )
    ) {
      localStorage.hasAcceptedStorage = true;
      return true;
    } else {
      return false;
    }
  }
}


export const LoginPage = ({setAppPage, isHidden}) => {
  const [user, setUser] = useState("");
  const [pwd, setPwd] = useState("");
  const [response, setResponse] = useState("");
  const accountManager = useContext(AccountManagerContext);

  return (
    <OverlayPage setAppPage={setAppPage} isHidden={isHidden}>
      <h3>Log in</h3>
      <form>
        <div className="form-group">
          <label>Username or ID</label>
          <input type="text" className="form-control user" value={user}
            onChange={(e) => setUser(e.target.value)}
          >
          </input>
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" className="form-control pw" value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          >
          </input>
        </div>
        <span>
          <button className="btn btn-default" onClick={() => {
            if (!hasAcceptedStorage()) {
              return;
            }
            // TODO: Validate input client-side first!
            accountManager.login(user, pwd, (result) => {
              if (result.exitCode != 0) {
                setResponse(result.error);
              } else {
                setAppPage("home");
              }
            });
          }}>
            Log in
          </button>
        </span>
      </form>
      <div className="response-display text-warning">{response}</div>
    </OverlayPage>
  );
};


export const SignupPage = ({setAppPage, isHidden}) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [response, setResponse] = useState("");
  const accountManager = useContext(AccountManagerContext);

  return (
    <OverlayPage setAppPage={setAppPage} isHidden={isHidden}>
      <h3>Create new account</h3>
      <form>
        <div className="form-group">
          <label>Username</label>
          <input type="text" className="form-control username" value={username}
            onChange={(e) => setUsername(e.target.value)}
          >
          </input>
        </div>
        <p className="text-info"><i>(Anonymous usernames are prefered.)</i></p>
        <div className="form-group">
          <label>E-mail address</label>
          <input type="email" className="form-control email" value={email}
            onChange={(e) => setEmail(e.target.value)}
          >
          </input>
        </div>
        <p className="text-info"><i>
          (For testing purposes, you can make a temporary account by 
          choosing a fake e-mail address.)<br/>
          The e-mail address' connection to this account will be erased 
          upon confirmation. 
          {/* An option to add an e-mail address to your account for 
            'changing forgotten passwords will only be added later. */}
          'So save your password!
        </i></p>
        <div className="form-group">
          <label>Password</label>
          <input type="password" className="form-control pw" value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          >
          </input>
        </div>
        <p className="text-info"><i>Choose a unique password!</i></p>
        <div className="checkbox" style={{fontSize: "11pt"}}>
          <label>
            <input type="checkbox" className="terms" value={isChecked}
              onChange={(e) => setIsChecked(e.target.value)}
            />
            I accept that the entities and ratings that I submit with 
            this account will be available to the public, and that they 
            will be shared upon request with any third party that 
            wishes to copy the SDB. This includes a user entity with 
            the username chosen here. (But it of course <b>does not 
            include</b> any data like the <b>e-mail address or 
            password</b> etc.)
            {/* Nor does it include any data about what you search for or 
            what you view on the site and when. */}
          </label>
        </div>
        <span>
          <button className="btn btn-default" onClick={() => {
            if (!hasAcceptedStorage()) {
              return;
            }
            if (!isChecked) {
              setResponse(
                'You need to accept the terms before creating an account.'
              );
              return;
            }
            // TODO: Validate input client-side first!
            accountManager.createNewAccount(username, email, pwd, (result) => {
              if (result.exitCode != 0) {
                setResponse(result.error);
              } else {
                setAppPage("home");
              }
            });
          }}>
            Submit
          </button>
        </span>
      </form>
      <div className="response-display text-warning">{response}</div>
    </OverlayPage>
  );
};


export const TutorialPage = ({setAppPage, isHidden}) => {
  return (
    <OverlayPage setAppPage={setAppPage} isHidden={isHidden}>
      <iframe src="tutorial.html" 
        style={{border: "none", width: "100%", height: "100%"}}
      >
      </iframe>
    </OverlayPage>
  );
};
