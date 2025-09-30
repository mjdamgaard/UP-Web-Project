
import {toPrecision, parseFloat} from 'number';
import {fetchMetric, fetchUserScore} from "/1/1/scores.js";
import {scoreHandler01} from "/1/1/score_handling/ScoreHandler01/em.js";

import * as InputRangeAndValue
from "../utility_components/InputRangeAndValue.jsx";



export function render({subjKey, qualKey}) {
  // TODO: Refactor this ScoreInterface component that uses a constant score
  // handler into a component with a prop/context-defined score handler, and
  // then a decorating component which can be used for a request origin
  // whitelist.
  let scoreHandler = scoreHandler01;
  let userEntID = this.subscribeToContext("userEntID");
  let {hasBegunFetching, metric, prevScore} = this.state;
  let content;

  // If the metric and the previous user score are not yet fetched, do so.
  if (!hasBegunFetching) {
    this.setState({...this.state, hasBegunFetching: true});
    fetchMetric(qualKey).then(metric => {
      this.setState(state => ({...state, metric: metric ?? false}));
    });
    if (userEntID) {
      fetchUserScore(qualKey, subjKey, userEntID).then(score => {
        this.setState(state => ({...state, prevScore: score ?? false}));
      });
    } else {
      this.setState(state => ({...state, prevScore: false}));
    }
    content = <div className="fetching"></div>;
  }

  else if (metric === undefined || prevScore === undefined) {
    content = <div className="fetching"></div>;
  }

  // TODO: Check here against a missing or ill-formed metric.


  // And if the metric is ready, render the score interface.
  else {
    let hasPrevScore = typeof prevScore === "number";
    let min = metric["Lower limit"] ?? -10;
    let max = metric["Upper limit"] ?? 10;
    let step = parseFloat(toPrecision((max - min) / 100, 3));
    content = <div>
      <div>
        <InputRangeAndValue key="0"
          value={hasPrevScore ? prevScore : undefined}
          placeholder={hasPrevScore ? undefined : "N/A"}
          min={min} max={max} step={step}
        />
      </div>
    </div>;
  }

  return (
    <div className="score-interface">{content}</div>
  );
}
