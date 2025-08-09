
export function render({colorID}) {
  return (
    <div className={(colorID !== undefined) ? "color-" + colorID : ""}></div>
  );
}
