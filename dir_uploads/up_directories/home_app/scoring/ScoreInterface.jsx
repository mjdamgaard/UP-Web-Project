
import {fetchMetric} from "/1/1/scores.js";

import * as InputRangeAndValue
from "../utility_components/InputRangeAndValue.jsx";



export function render({subjKey, qualKey}) {
  // TODO: Refactor this ScoreInterface component that uses a constant score
  // handler into a component with a prop/context-defined score handler, and
  // then a decorating component which can be used for a request origin
  // whitelist.
  let scoreHandler = {}; // TODO: Get score handler..
  let userEntID = this.subscribeToContext("userEntID");
  let {hasBegunFetching, metric, prevScore} = this.state;
  let content;

  // If the metric and the previous user score are not yet fetched, do so.
  if (!hasBegunFetching) {
    this.setState({...this.state, hasBegunFetching: true});
    fetchMetric(qualKey).then(metric => {
      this.setState(state => ({...state, metric: metric ?? false}));
    });
    fetchUserScore(qualKey, subjKey, userEntID).then(score => {
      this.setState(state => ({...state, prevScore: score ?? false}));
    });
    content = <div className="fetching"></div>;
  }

  // TODO: Check here against a missing or ill-formed metric.


  // And if the metric is ready, render the score interface.
  else {
    content = <div>

      <InputRangeAndValue key="0"
        placeholder={prevScore === false ? "N/A" : undefined}
      />
    </div>;
  }

  return (
    <div className="score-interface">{content}</div>
  );
}
