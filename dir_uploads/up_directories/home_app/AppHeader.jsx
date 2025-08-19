


export function render() {
  return <header className="app-header">
    <div className="logo" onClick={() => {
      this.trigger("goToHomePage");
    }}>{"LogoTBD"}</div>
    <div onClick={() => {
      this.trigger("goToAboutPage");
    }}>{"About"}</div>
    <div onClick={() => {
      this.trigger("goToTutorialsPage");
    }}>{"Tutorials"}</div>
  </header>;
}
