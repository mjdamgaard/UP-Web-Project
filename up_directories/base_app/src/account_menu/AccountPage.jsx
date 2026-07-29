
import {fetchGasReserves} from 'account';


export async function initialize() {
  let gas = await fetchGasReserves().catch(err => console.error(err));
  this.setState({gas: gas ?? {}});
}

export function render({}) {
  let userID = this.getContext("userID");
  let username = this.getContext("username");
  let {gas} = this.state;
  return <div className="account-page">
    <div className="go-back-button" onClick={() => this.do("goBack")}></div>
    <div className="page-content">
      <h2>My account</h2>
      <h4>User info</h4>
      <dl className="user-info-list">
          <dt>Username</dt><dd>{username}</dd>
          <dt>User ID</dt><dd>{userID}</dd>
      </dl>
      <h4>User gas reserve</h4>
        {(!gas ? <div className="fetching"></div> :
          <dl className="user-gas-list">
            <dt>Computation gas</dt><dd>{gas.comp}</dd>
            <dt>DB reading gas</dt><dd>{gas.dbRead}</dd>
            <dt>DB writing gas</dt><dd>{gas.dbWrite}</dd>
            <dt>Directory creation gas</dt><dd>{gas.mkdir}</dd>
            <dt>DB table creation gas</dt><dd>{gas.mkTable}</dd>
            <dt>Time gas</dt><dd>{gas.time}</dd>
            <dt>Connection gas</dt><dd>{gas.conn}</dd>
            <dt>Fetching gas</dt><dd>{gas.fetch}</dd>
          </dl>
        )}
    </div>
  </div>;
}


export const actions = {
  "goBack": function() {
    this.trigger("closeOverlayPage");
  },
};


