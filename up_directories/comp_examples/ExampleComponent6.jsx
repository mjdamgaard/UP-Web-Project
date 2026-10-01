


export function render() {
  return <div>
    <button onClick={() => this.trigger("increaseCounter")}>
      Click me to increase my parent's counter!
    </button>
  </div>;
}
