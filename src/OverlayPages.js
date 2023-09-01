
import {
  ContentLoader,
} from "/src/ContentLoader.js";
import {
  sdbInterfaceCL, dbReqManager, accountManager,
} from "/src/content_loaders/SDBInterface.js";





export const OverlayPage = ({children, setAppPage}) => {
  return (
    <div>
      <div class="left-margin">
        <GoBackButton setAppPage={setAppPage} />
      </div>
      <div class="content-container">
        {children}
      </div>
      <div class="right-margin"></div>
    </div>
  );
};


export const GoBackButton = ({setAppPage}) => {
  return (
    <span onClick={() => setAppPage("home")}>
      &#10094;
    </span>
  );
};



export const LoginPage = ({setAppPage}) => {
  return (
    <OverlayPage>
      <h3>Log in</h3>
      <form action="javascript:void(0);">
        <div class="form-group">
          <label>Username or ID</label>
          <input type="text" class="form-control user"></input>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" class="form-control pw"></input>
        </div>
        <span>
          <button class="btn btn-default">Log in</button>
        </span>
      </form>
      <div class="response-display text-warning"></div>
    </OverlayPage>
  );
};
// loginPageCL.addCallback(function($ci, data) {
//   $ci.on("submit", function() {
//     let $this = $(this);
//     if (!hasAcceptedStorage()) {
//       return;
//     }
//     $this.find('.response-display').empty();
//     let user = $this.find('.user').val();
//     let pw = $this.find('.pw').val();
//     // TODO: Validate input client-side first!
//     accountManager.login(user, pw, $this, function($ci, result) {
//       if (result.exitCode != 0) {
//         $ci.find('.response-display').text(result.error);
//       } else {
//         $ci.trigger("logged-in");
//         $ci.trigger("back-to-main");
//       }
//     });
//     return false;
//   });
// });
// loginPageCL.addCallback(function($ci, data) {
//   if (!hasAcceptedStorage()) {
//     return;
//   }
// });
export function hasAcceptedStorage() {
  if (localStorage.hasAcceptedStorage) {
    return true;
  } else {
    if (
      confirm(
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


export const CreateAccountPage = ({setAppPage}) => {
  return (
    <OverlayPage>
      <h3>Create new account</h3>
      <form action="javascript:void(0);">
        <div class="form-group">
          <label>Username</label>
          <input type="text" class="form-control username"></input>
        </div>
        <p class="text-info"><i>(Anonymous usernames are prefered.)</i></p>
        <div class="form-group">
          <label>E-mail address</label>
          <input type="email" class="form-control email"></input>
        </div>
        <p class="text-info"><i>
          (For testing purposes, you can make a temporary account by 
          choosing a fake e-mail address.)<br/>
          The e-mail address' connection to this account will be erased 
          upon confirmation. 
          {/* An option to add an e-mail address to your account for 
            'changing forgotten passwords will only be added later. */}
          'So save your password!
        </i></p>
        <div class="form-group">
          <label>Password</label>
          <input type="password" class="form-control pw"></input>
        </div>
        <p class="text-info"><i>Choose a unique password!</i></p>
        <div class="checkbox" style="font-size: 11pt;">
          <label><input type="checkbox" class="terms" value="" />
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
          <button class="btn btn-default">Submit</button>
        </span>
      </form>
      <div class="response-display text-warning"></div>
    </OverlayPage>
  );
};
// createAccountPageCL.addCallback(function($ci, data) {
//   $ci.on("submit", function() {
//     let $this = $(this);
//     if (!$this.find('input.terms').is(':checked')) {
//       $this.find('.response-display').text(
//         'You need to accept the terms before creating an account.'
//       );
//       return;
//     }
//     if (!hasAcceptedStorage()) {
//       return;
//     }
//     let username = $this.find('.username').val();
//     let email = $this.find('.email').val();
//     let pw = $this.find('.pw').val();
//     // TODO: Validate input client-side first!
//     accountManager.createNewAccount(username, email, pw, $this,
//       function($ci, result) {
//         if (result.exitCode != 0) {
//           $ci.find('.response-display').text(result.error);
//         } else {
//           $ci.trigger("logged-in");
//           $ci.trigger("back-to-main");
//         }
//       }
//     );
//     return false;
//   });
// });
// createAccountPageCL.addCallback(function($ci, data) {
//   if (!hasAcceptedStorage()) {
//     return;
//   }
// });


export const TutorialPage = ({setAppPage}) => {
  return (
    <OverlayPage>
      <iframe src="tutorial.html" 
        style="border:none; width: 100%; height: 100%;"
      >
      </iframe>
    </OverlayPage>
  );
};
