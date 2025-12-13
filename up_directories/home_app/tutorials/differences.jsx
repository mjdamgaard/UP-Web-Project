


export function render() {
  return page;
}



const page = <div className="text-page">
  <h1>{"..."}</h1>
  <section>
    <h2>{"..."}</h2>
    {/* ... */}
    <p>{
      "Note that the fact that we need to bind the 'this' keyword is also " +
      "why you should never define the render() function as an arrow " +
      "function, as this will prevent the correct binding of the 'this' " +
      "keyword."
    }</p>

    {/* ... */}

    <p>{
      "You are also very welcome to send an e-mail to mads@up-web.org if you " +
      "have any questions. And if you run into any bugs that you don't know " +
      "how to solve, please feel free to send an e-mail as well, as I " +
      "might be able to help you."
    }</p>
  </section>
</div>;
