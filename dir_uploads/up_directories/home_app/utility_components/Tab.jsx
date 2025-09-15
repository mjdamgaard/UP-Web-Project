

// TODO: At some point implement the the title as an ILink such that ctrl-
// clicking/middle-clicking it can lead to another browser tab instead (or
// implement another TabbedPages and Tab component that allow for this). 


export function render({tabKey, children: title, isOpen, isLoaded}) {
  return (
    <div className={
      "tab" + (isOpen ? " open" : "") + (isLoaded ? " loaded" : "")
    }>
      <span className="title" onClick={() => {
        this.trigger("open-tab", tabKey);
      }}>{title}</span>
      <span className="close-button" onClick={function() {
        this.trigger("close-tab", tabKey);
      }}></span>
    </div>
  );
}

