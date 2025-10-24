

export function render({userID}) {
  return (
    <div className="friend-request-display">
      <h3>{"Add new friend"}</h3>
      <div>{
        "Type in the current username of friend you wish to add, or type " +
        "in their user ID preceded by a '#' (as in '#123')"
      }</div>
    </div>
  );
}