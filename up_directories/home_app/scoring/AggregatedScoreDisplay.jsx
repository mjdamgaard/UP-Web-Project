


export function render({score, weight, qualKey, subjKey, scoreHandler}) {
  scoreHandler = scoreHandler ?? this.subscribeToContext("scoreHandler");

  if (score !== undefined) {
    return (
      <div className="aggregated-score">
        <div className="score">{score}</div>
        <div className="weight">{weight}</div>
      </div>
    );
  }


  // TODO: If score is not provided, fetch the score from qualKey + subjKey.

  else return <div className="aggregated-score"></div>;
}