
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';


export function render() {
  return page;
  return page2;
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




const page2 = <div className="text-page">
  <h1>Database queries</h1>
  <p>
    In this tutorial, we will go through all the database table files that
    are currently available, and show how these can be used, together with
    the 'hex' and the 'connection' library, to create any kind data structure
    that you want.  
  </p>
  <section>
    <h2>Overview of available database file types</h2>
    <p>
      In the
      <ILink key="link-tut-5" href="~/server-modules" >
        previous tutorial
      </ILink>,
      we introduced database files, and showed some examples of how to use
      them, in particular for the '.att' file extension.
    </p>
    <p>
      Recall that ATT stands for 'Automatic-key Text Table,' and that these
      files essentially represents relational tables of the following form.
    </p>
    <p>
      <code className="sql">{[
        'CREATE TABLE AutoKeyTexts (\n',
        '  key BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,\n',
        '  payload TEXT\n',
        ');',
      ]}</code>
    </p>
    <p>
      We also have '.abt' files, which stands for 'Automatic-key Binary Table,'
      and which essentially represents tables of a similar form, but with a
      binary payload column instead:
    </p>
    <p>
      <code className="sql">{[
        'CREATE TABLE AutoKeyTexts (\n',
        '  key BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,\n',
        '  payload BLOB\n',
        ');',
      ]}</code>
    </p>
    <p>
      Then we have '.bt' files, which stands for 'Binary-key Tables,' and are
      of the following form.
    </p>
    <p>
      <code className="sql">{[
        'CREATE TABLE BinaryKeyTables (\n',
        '  key VARBINARY(255) PRIMARY KEY,\n',
        '  payload VARBINARY(255) NOT NULL DEFAULT ""\n',
        ');',
      ]}</code>
    </p>
    <p>
      Then we have '.bbt' files...
    </p>
    <p>
      <code className="sql">{[
        'CREATE TABLE BinaryKeyBinaryScoreTables (\n',
        '  key VARBINARY(255) PRIMARY KEY,\n',
        '  score VARBINARY(255) NOT NULL,\n',
        '  payload VARBINARY(255) NOT NULL DEFAULT "",\n',
        '  UNIQUE INDEX (\n',
        '      score,\n',
        '      key\n',
        '  )\n',
        ');',
      ]}</code>
    </p>
    <p>
      Then we have '.ct' files...
    </p>
    <p>
      <code className="sql">{[
        'CREATE TABLE CharKeyTables (\n',
        '  key VARCHAR(255) PRIMARY KEY,\n',
        '  payload VARBINARY(255) NOT NULL DEFAULT ""\n',
        ');',
      ]}</code>
    </p>
    
    <h4>BT files</h4>
    <p>
      The 
    </p>

  </section>
</div>;