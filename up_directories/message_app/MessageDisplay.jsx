


export function render({message, authorID, userID, index}) {
  // TODO: Import a function to fetch the user tag of the author given the
  // authorID.
  // TODO: Add 'Delete' button, if the author is the current user. 
  return (
    <div className="message-display">
      {message}
    </div>
  );
}
