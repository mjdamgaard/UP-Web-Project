
export function render({colorID}) {
  return (
    <div className={
      (colorID !== undefined) ? "peg color-" + colorID : "peg hidden"
      }>
    </div>
  );
}
