
import {toPrecision} from 'number';


export function render({score, weight, qualKey, subjKey, scoreHandler}) {
  scoreHandler = scoreHandler ?? this.subscribeToContext("scoreHandler");
  let {scoreData, isFetching} = this.state;

  if (score !== undefined) {
    score = (score === undefined) ? "N/A" : toPrecision(score, 3);
    weight = (weight === undefined) ? "N/A" : toPrecision(weight, 3);
    return (
      <div className="aggregated-score">
        <div className="score">{score}</div>
        <div className="weight">{weight}</div>
      </div>
    );
  }

  else if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    scoreHandler.fetchScoreData(qualKey, subjKey).then(scoreData => {
      this.setState(state => ({...state, scoreData: scoreData ?? false}));
    });
  }

  else if (scoreData === undefined) {
    return (
      <div className="aggregated-score fetching">
        <div className="score fetching">{"..."}</div>
        <div className="weight fetching">{"..."}</div>
      </div>
    );
  }

  else if (!scoreData) {
    return (
      <div className="aggregated-score missing">
        <div className="score missing"></div>
        <div className="weight missing"></div>
      </div>
    );
  }

  else {
    let [score, weight] = scoreData ?? [];
    score = (score === undefined) ? "N/A" : toPrecision(score, 3);
    weight = (weight === undefined) ? "N/A" : toPrecision(weight, 3);
    return (
      <div className="aggregated-score">
        <div className="score">{score}</div>
        <div className="weight">{weight}</div>
      </div>
    );
  }
}


export const methods = [
  "update",
];

export const actions = {
  "update": function() {
    this.setState({});
  }
};


export const styleSheets = [
  abs("./AggregatedScoreDisplay.css"),
];