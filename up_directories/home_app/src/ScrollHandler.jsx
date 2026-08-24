


export function initialize() {
  this.trigger("setOnScroll", ({scrollTop}) => this.setHistoryState(scrollTop));
  let scrollTop = this.getHistoryState(scrollTop => 
    this.trigger("scrollTo", {top: scrollTop ?? 0, behavior: "instant"})
  );
  this.doAfterRender(() =>
    this.trigger("scrollTo", {top: scrollTop ?? 0, behavior: "instant"})
  );

}

export function render({children}) {
  return children;
}