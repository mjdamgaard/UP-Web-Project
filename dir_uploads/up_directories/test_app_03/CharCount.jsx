

export function render() {
  return (
    <span>
      {"Character count: "}{this.state.count ?? 0}
    </span>
  );
}

export const methods = {
  "setCharCount": function(count) {
    this.setState({count: count});
  }
};