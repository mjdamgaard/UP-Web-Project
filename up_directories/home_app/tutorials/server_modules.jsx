
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';


export function render() {
  return page;
}



const page = <div className="text-page">
  <h1>Server modules</h1>
  <section>
    <h2>Introduction</h2>
    <p>
      When an app needs to store data on the server, it does so by creating a
      so-called server module (SM), which is a JS module whose exported
      functions are allowed to be executed serve-side.
    </p>
    <p>
      The server modules are recognized by a special file extension of
      ".sm.js". Whenever you crate a file with this extension at the end, you
      thus tell the server the exported functions of that module is allowed to
      be called by the clients and executed on the server.
    </p>
    <p>
      And whenever a server module function (SMF) is called this way, it is
      granted admin privileges on the home directory of the given app during
      the function's execution. This means that it is allowed to insert and
      delete data from the database tables associated with that home directory,
      as well as read data from locked files within it. 
    </p>
  </section>

  <section>
    <h2>Example of a server module</h2>
    <p>
      Before we explain the server modules in more detail, let us first look at
      an example of an app that uses a backend.
    </p>
    <p>
      If you have already followed the
      <ILink key="link-tut-1" href="~/getting-started">
        Getting started
      </ILink>
      tutorial, and downloaded the GitHub...
    </p>
  </section>

  <section>
    <h2>...</h2>
    <p>
      ... In this file you will see the following four exported functions.
    </p>
    <p>
      <code className="jsx">{[
      'export async function postMessage(text) { ... }\n',
      // '\n',
      'export async function deleteMessage(messageID) { ... }\n',
      // '\n',
      'export async function editMessage(messageID, newText) { ... }\n',
      // '\n',
      'export async function fetchMessages(maxNum = "1000", offset = "0") { ... }\n',
      // '\n',
      ]}</code>
    </p>
    <p>
      These are the SMFs that the client can call to respectively post a new
      message, delete a message, edit a message, or fetch a list of the
      existing messages.
    </p>
    <p>
      If you are not familiar with the 'async' and 'await' keywords, you can
      read about them
      <ELink key="link-w3-async"
        href="https://www.w3schools.com/js/js_async.asp"
      >
        here
      </ELink>
      or
      <ELink key="link-moz-async"
        href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function"
      >
        here
      </ELink>.
    </p>
    <p>
      Let us now start by looking at the postMessage() SMF first, which reads:
    </p>
    <p>
      <code className="jsx">{[
      'import {post, fetch, fetchPrivate} from \'query\';\n',
      'import {getRequestingUserID, checkRequestOrigin} from \'request\';\n',
      '\n',
      '...\n',
      '\n',
      'export async function postMessage(text) {\n',
      '  // Check that the post request was sent from the ../main.jsx app component.\n',
      '  checkRequestOrigin(true, [\n',
      '    abs("../main.jsx"),\n',
      '  ]);\n',
      '\n',
      '  // Get the ID of the requesting user, i.e. the author of the message.\n',
      '  let authorID = getRequestingUserID();\n',
      '\n',
      '  // Store the authorID simply by prepending it to the stored text.\n',
      '  let storedText = authorID + ";" + text;\n',
      '\n',
      '  // Insert the massage in the messages.att table.\n',
      '  return await post(\n',
      '    abs("./messages.att./_insert"),\n',
      '    storedText\n',
      '  );\n',
      '}',
      ]}</code>
    </p>
    <p>
      This function first checks the origin of the request via the a call to a
      function called 'checkRequestOrigin()' from the 'request' developer
      library. This is very important to do for all SMFs that inserts or
      modifies data in the database, or reads and returns private data.
    </p>
    <p>
      This particular call to checkRequestOrigin() checks that the origin of
      the request is the message app defined by the '~/main.jsx' in the same
      home directory.
    </p>
    <p>
      We will get back to how the checkRequestOrigin() function works in more
      detail, as well as how the origin of a request is determined, in a later
      section below.  
    </p>
    <p>
      The next thing that postMessage() message does is to get the (hexadecimal)
      ID of of the requesting user, and then combine this with the input text,
      using ";" as a separator, before storing inserting it in the database.
    </p>
    <p>
      There are also other ways that we could store this data which are more
      efficient in terms of storage space. But for the sake of simplicity, we
      just store all the data as a single encoded text for this tutorial.
    </p>
    <p>
      There are also other ways that we could store this data which are more
      efficient in terms of storage space. But for the sake of simplicity, we
      just store all the data as a single encoded text for this tutorial.
    </p>
    <p>
      Finally, postMessage() inserts the encoded text in the database via a
      call to a function called 'post()' imported from the 'query' developer
      library:
    </p>
    <p>
      <code className="jsx">{[
      '// Insert the massage in the messages.att table.\n',
      'return await post(\n',
      '  abs("./messages.att./_insert"),\n',
      '  storedText\n',
      ');',
      ]}</code>
    </p>
    <p>
      As you can see, the first argument of post() is an absolute path to the
      'message.att' file located in the same subdirectory as 'messages.sm.js',
      but with an additional string of "./_insert" appended to the end as well.
      And the second argument is the text to be stored in the database.
    </p>
    <p>
      In short, this function call has the effect of inserting the text held
      by the 'storedText' variable in a relational database table denoted by
      the 'messages.att' file. We will explain how such database table files
      work in the following section, as well as explain the syntax and purpose
      of the appended "./_insert" string. 
    </p>
  </section>

  <section>
    <h2>Database table files</h2>
    <p>
      The 'message.att' file is an example of a database table file. The file
      itself does not contain any data, as you can see if you open it up. But
      when the file is uploaded to the server, it instructs the server to
      essentially create a new database table associated with that file.
    </p>
    <p>
      The type of database table created depends on the extension of the file.
      For instance, '.att' stands for "Automatic-key Text Table", and
      essentially corresponds to a table of the form when expressed in MySQL:
    </p>
    <p>
      <code className="sql">{[
      'CREATE TABLE AutoKeyTextTable (\n',
      '  text_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,\n',
      '  text_data TEXT\n',
    ');',
      ]}</code>
    </p>
    <p>
      In other words, the '.att' files represent simple tables with only two
      columns, namely a 'text_id' and a 'text_data' column, where a unique
      'text_id' is automatically generated whenever the client does not specify
      it explicitly.
    </p>
    <p>
      There are also other kinds of database table files, but we will wait
      to introduce these in the
      <ILink key="link-tut-6-1" href="~/db_queries">
        next tutorial
      </ILink>.
    </p>
    <p>
      ...
    </p>
  </section>
</div>;
