


export function render() {
  return <div>
    <h1>{"List of tutorials"}</h1>
    <ol>
      <li className="link" onClick={() => {
        this.trigger("goToIntroTutorialPage");
      }}>{
        "Introduction"
      }</li>
    </ol>
  </div>;
}