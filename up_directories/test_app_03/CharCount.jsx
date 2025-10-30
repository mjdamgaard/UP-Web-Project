

export function render() {
  return (
    <span>
      {"Character count: "}{this.state.count ?? 0}
    </span>
  );
}

export const methods = [
  "setCharCount",
];

export const actions = {
  "setCharCount": function(count) {
    this.setState({count: count});
  }
};