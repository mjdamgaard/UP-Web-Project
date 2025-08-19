


export function render() {
  return <div>
    <h1>{"List of tutorials"}</h1>
    <ol className="tutorial-list">
      <li className="link" onClick={() => {
        this.trigger("goToIntroTutorialPage");
      }}>{
        "Tutorial: Basics"
      }</li>
    </ol>
  </div>;
}