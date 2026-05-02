


export function render({score, qualKey, subjKey}) {

  if (score !== undefined) {
    return (
      <div className="user-score">{score}</div>
    );
  }

  // TODO: If score is not provided, fetch the score from qualKey + subjKey.

  else return <div className="user-score"></div>;
}