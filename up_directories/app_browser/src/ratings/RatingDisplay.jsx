
import {fetch, fetchPrivate, post} from 'query';
import {round, floor, log10} from 'math';
import {parseInt, isNaN} from 'number';


export const keyProps = ["userID", "objID", "relID", "subjID"];

export async function initialize({userID, objID, relID, subjID}) {
  let [[upRateSum, downRateSum], userRateVal] = await Promise.all([
    fetch(abs(
      "~/../base_app/server/rates/rates.sm.js/callSMF/fetchUpAndDownRates/" +
      objID + "/" + relID + "/" + subjID
    )),
    userID ? fetchPrivate(abs(
      "~/../base_app/server/rates/rates.sm.js/callSMF/fetchUserRateValue/" +
      objID + "/" + relID + "/" + subjID
    )) : new Promise(res => res()),
  ]);
  this.setState({
    upRateSum: upRateSum, downRateSum: downRateSum, userRateVal: userRateVal,
    isPostingRef: new MutableArray(),
  });
}


export function render({userID}) {
  let {upRateSum, downRateSum, userRateVal, isPostingRef} = this.state;
  upRateSum   = shortenNumber(upRateSum);
  downRateSum = shortenNumber(downRateSum);
  let upButtonClassName = "up-rate-button" +
    (userRateVal === 1 ? " pressed" : "") + (userID ? "" : " inactive");
  let downButtonClassName = "down-rate-button" +
    (userRateVal === -1 ? " pressed" : "") + (userID ? "" : " inactive");
  return <div className={"rating-display" + (userID ? "" : " inactive")}>
    <div className="up-rates">
      <div className={upButtonClassName} onClick={
        () => userID && !isPostingRef[0] && this.do("toggleUpRate")
      }></div>
      <div className="up-rate-sum">{upRateSum}</div>
    </div>
    <div className="down-rates">
      <div className={downButtonClassName} onClick={
        () => userID && !isPostingRef[0] && this.do("toggleDownRate")
      }></div>
      <div className="down-rate-sum">{downRateSum}</div>
    </div>
  </div>;
}


export const actions = {
  "toggleUpRate": function() {
    return this.do("toggleRate", "up");
  },
  "toggleDownRate": function() {
    return this.do("toggleRate", "down");
  },
  "toggleRate": async function(type) {
    let {upRateSum, downRateSum, userRateVal, isPostingRef} = this.state;
    isPostingRef[0] = true;
    let newUserRateValue = type === "up" ? (userRateVal !== 1 ? 1 : 0) : 
      (userRateVal !== -1 ? -1 : 0);
    await post(abs(
      "~/../base_app/server/rates/rates.sm.js/callSMF/updateUpOrDownRate/" +
      objID + "/" + relID + "/" + subjID + "/" + newUserRateValue
    ));
    this.trigger("rating-changed", newUserRateValue);
    this.reset();
    isPostingRef[0] = false;
  },
};




export function shortenNumber(val) {
  if (val === undefined) return val;
  val = parseInt(val);
  if (isNaN(val)) {
    return val;
  }
  if (val >= 10 ** 12) {
    let exp = floor(log10(val));
    return (val / 10 ** exp).toPrecision(3) + "E" + exp;
  }
  if (val >= 10 ** 9) {
    return round(val / 10 ** 9) + "B";
  }
  if (val >= 10 ** 6) {
    return round(val / 10 ** 6) + "M";
  }
  if (val >= 10 ** 3) {
    return round(val / 10 ** 3) + "K";
  }
  else if (val >= 0) {
    return round(val);
  }
  else {
    return "-" + shortenNumber(-val);
  }
}