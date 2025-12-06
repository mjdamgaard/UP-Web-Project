
import {toPrecision} from 'number';


export function render({score, weight, qualKey, subjKey, scoreHandler}) {
  scoreHandler = scoreHandler ?? this.subscribeToContext("scoreHandler");
  let {scoreData, isFetching} = this.state;

  if (score !== undefined) {
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
    return (
      <div className="aggregated-score">
        <div className="score">{toPrecision(scoreData[0], 3)}</div>
        <div className="weight">{toPrecision(scoreData[1], 3)}</div>
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


export const styleSheetPaths = [
  abs("./AggregatedScoreDisplay.css"),
];