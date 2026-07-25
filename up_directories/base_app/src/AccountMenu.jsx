

export function render({isLoggedIn}) {
  return (
    <div className="account-menu">
      <div id="account-menu-header">
        <div id="user-name-display"></div>
        <div id="user-icon">
          <img className="general-user-icon" src="/assets/user-4254.svg" alt="" />
        </div>
      </div>

      <div className="items">
        <div id="account-page-item" className="when-logged-in">
          <span>Account</span>
        </div>
        <div id="profile-page-item" className="when-logged-in">
          <span>Profile</span>
        </div>
        <div id="logout-item" className="when-logged-in">
          <span>Log out</span>
        </div>
        <div id="login-item" className="when-logged-out">
            <span>Log in</span>
        </div>
        <div id="create-account-item" className="when-logged-out">
          <span>Sign up</span>
        </div>
      </div>
    </div>
  );
}