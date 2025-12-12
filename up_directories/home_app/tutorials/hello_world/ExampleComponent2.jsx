


export function render({isItalic = false, children}) {
  if (isItalic) {
    return <i>{children}</i>;
  }
  else {
    return <span>{children}</span>;
  }
}