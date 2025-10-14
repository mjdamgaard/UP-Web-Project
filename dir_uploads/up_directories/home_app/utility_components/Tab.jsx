

// TODO: At some point implement the the title as an ILink such that ctrl-
// clicking/middle-clicking it can lead to another browser tab instead (or
// implement another TabbedPages and Tab component that allow for this). (This
// will also allow users to select tabs with the tab key, and to go to them
// via pressing Enter, at least once we also implement this for the ILink
// component.)


export function render({tabKey, children: title, isOpen, isLoaded}) {
  return (
    <div className={
      "tab" + (isOpen ? " open" : "") + (isLoaded ? " loaded" : "")
    }>
      <span className="title" onClick={() => {
        this.trigger("open-tab", tabKey);
      }}>{title}</span>
      <span className="close-button" onClick={() => {
        this.trigger("close-tab", tabKey);
      }}></span>
    </div>
  );
}

