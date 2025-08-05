
/* Foo */

export function render({name}) {
  return (
    <span>
      {name}{"  "}
      <i onClick={() => {
        this.trigger("changeName", "Another Name");
      }}>
        {"or click here!"}
      </i>
    </span>
  );
}

export const methods = [
  "fooMethod1",
  "fooMethod2",
];

export const actions = {
  "fooMethod1": function(name) {
    this.trigger("changeName", name);
  },
  "fooMethod2": function(name) {
    this.trigger("IAmAnAlias", name);
  },
};