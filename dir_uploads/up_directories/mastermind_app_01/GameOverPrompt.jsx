
export function render({isDone, hasWon, answers}) {
  let guessNum = answers.length;
  let message = !isDone ? "" : hasWon ? (
    "Congratulations! You guessed correctly with " + guessNum + " attempts."
  ) : (
    "Your lost. Better luck next time!"
  );
  return (
    <div className={"prompt" + (isDone ? "" : " inactive")}>
      <div>{message}</div>
      <div>
        <button onClick={() => {
          this.trigger("exit");
        }}>{
          "Exit"
        }</button>
        <button onClick={() => {
          this.trigger("newGame");
        }}>{
          "New game"
        }</button>
      </div>
    </div>
  );
}
