

export function render({otherUserID, ownUserID, timestamp}) {
  return (
    <div className="friend-request-display">
      {"Friend request from User " + otherUserID}
    </div>
  );
}