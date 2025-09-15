


// tabs := [[tabKey, {title, component, props}],)*].

export function render({tabs, closeInActiveTabs = undefined}) {
  closeInActiveTabs = closeInActiveTabs ??
    this.subscribeToContext("closeInActiveTabs") ?? false;


  return (
    <div></div>
  );
}
