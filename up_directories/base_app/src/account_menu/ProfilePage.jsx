

export function render({}) {
  return <div className="profile-page">
    <div className="go-back-button" onClick={() => this.do("goBack")}></div>
    <div className="page-content">
      <h2>User profile</h2>
      {/* ... */}
    </div>
  </div>;
}


export const actions = {
  "goBack": function() {
    this.trigger("closeOverlayPage");
  },
};


