
import {fetchGasReserves} from 'account';

export function render({}) {
  return <div className="account-page">
    <div className="go-back-button" onClick={() => this.do("goBack")}></div>
    <div className="page-content">
      <h2>Account</h2>
      {/* ... */}
    </div>
  </div>;
}


export const actions = {
  "goBack": function() {
    this.trigger("closeOverlayPage");
  },
};


