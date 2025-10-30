
export function render() {
  return (
    <div>
      <p className="default-paragraph">
        {"I am a nested component instance with my own default style."}
      </p>
      <p className="alternative-paragraph">
        {"I am a nested component instance styled by my parent, and thus " +
        "belonging to the same style scope as my parent."}
      </p>
    </div>
  );
}


export const stylePath = "./foo.style1.js";