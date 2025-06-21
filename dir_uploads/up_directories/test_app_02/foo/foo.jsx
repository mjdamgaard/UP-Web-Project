
/* Foo */

export function render({name}) {
  return (
    <span>
      {name}{"  "}
      <i onClick={() => {
        this.dispatch("changeName", "Another Name");
      }}>
        {"or click here!"}
      </i>
    </span>
  );
}


export const methods = {
  "myMethod": function(name) {
    this.dispatch("changeName", name);
  },
};