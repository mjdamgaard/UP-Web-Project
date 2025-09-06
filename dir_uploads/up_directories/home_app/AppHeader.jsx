


export function render() {
  return <header className="app-header">
    <div className="logo" onClick={() => {
      this.trigger("goToPage", "home");
    }}>{"LogoTBD"}</div>
    <div onClick={() => {
      this.trigger("goToPage", "about");
    }}>{"About"}</div>
    <div onClick={() => {
      this.trigger("goToPage", "tutorials");
    }}>{"Tutorials"}</div>
  </header>;
}
