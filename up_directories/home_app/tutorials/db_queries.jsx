
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';


export function render() {
  return page;
}



const page = <div className="text-page">
  <h1>{"Database queries"}</h1>
  <section>
    <h2>{"..."}</h2>
    <p>{
      "This tutorial is soon underway..."
    }</p>
    

  </section>
</div>;


// Disposition:
// - A section introducing the '.bt' table files, and also mentions the
// hex encoding.
// This time, the documentation should be complete (w.r.t. what's currently
// implemented)
//
// - A section about the 'hex' library.
//
// - A documentation section for all the current file extensions
// (and maybe I also want to implement the '.abt' extension already, and
// include that).
// I think I want to also shown an (My)SQL example for each of these tables,
// like I did in the previous tutorial.
// I think I could maybe make the section similar to the 'Query functions'
// section of the previous tutorial, and then reference the BT section above
// to make it shorter and easier to go through (and where I can continue to
// reference back to previous subsections for each new subsection).
//
// - A section about DB connections and transactions (and locks as well).
//
// - A section about text file queries.
//
// - A section about casting segments (starting with ;get and ;call, naturally).
//
// - A section about fetching and posting from the uploader program.
