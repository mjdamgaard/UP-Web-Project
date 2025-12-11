


export function render({italic, children}) {
  if (italic) {
    return <i>{children}</i>;
  }
  else {
    return <span>{children}</span>;
  }
}