
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
      <ILink key="link-tut-1-1" href="~/getting-started">
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
      Let us now start by looking at the postMessage() SMF first, which reads
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
      function called 'checkRequestOrigin()' from the 'request'
      library. This is very important to do for all SMFs that inserts or
      modifies data in the database, or reads and returns private data.
    </p>
    <p>
      This particular call to checkRequestOrigin() checks that the origin of
      the request is the message app defined by the '~/main.jsx' in the same
      home directory.
    </p>
    <p>
      We will get back to checkRequestOrigin() and how it works in a later
      section below, as well as how the origin of a request is determined.  
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
      call to a function called 'post()' imported from the 'query' library:
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
      And if the file is subsequently removed by the user, the server-side
      file and associated table will also be removed when the user uploads the
      directory again, and any data held by the table will thus also be deleted.
    </p>
    <p>
      WARNING: If you move or rename a database table file, or rename any of
      its parent subdirectories such that its file path relative to the home
      directory changes, the
      uploader program will treat this as a deletion of the file, and will
      delete the data in the associated table. So be careful
      about changing the file structure of an app once it is already being
      used online by other users.
      <ILink key="link-tut-6-1" href="~/db-queries">
        Tutorial 6
      </ILink>
      will teach you how you can safely move or rename a database table file
      without losing its data. 
    </p>
    <p>
      The type of database table created depends on the extension of the file.
      For instance, '.att' stands for "Automatic-key Text Table," and
      essentially corresponds to a table of the following form, when expressed
      in SQL.
    </p>
    <p>
      <code className="sql">{[
        'CREATE TABLE AutoKeyTexts (\n',
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
      There are also other kinds of database table files with different
      file extension, which will be introduced in the
      <ILink key="link-tut-6-2" href="~/db-queries">
        next tutorial
      </ILink>.
    </p>
    <p>
      The way to interact with the data stored for these database table files
      is via the kind of extended paths similar to the
      abs("./messages.att./_insert") path that we saw above. We will also refer
      to such extended paths as 'routes.' The routes used to interact with
      database table files have the following syntax.
    </p>
    <p>
      <code className="jsx">{[
        '"ABSOLUTE_PATH_TO_FILE./QUERY_TYPE(/PARAM/VALUE)*"',
      ]}</code>
    </p>
    <p>
      Here ABSOLUTE_PATH_TO_FILE is a placeholder for the absolute path to the
      file, QUERY_TYPE is a placeholder for a query type such as "_insert" as
      we saw above, and PARAM and VALUE are a pair of respectively a parameter
      name and corresponding input value.
    </p>
    <p>
      The './' in such routes should thus be interpreted as essentially
      meaning: "Do something with this file (or directory)." Also note that
      file names and directory names are not allowed to end with '.' in this
      system, which means that any occurrence of './' will always have this
      meaning.
    </p>
    <p>
      Here are a few examples of such routes for the '.att' files, where
      ".../my_file.att" is a placeholder for the absolute path to a file
      called 'my_file.att':
    </p>
    <p>
      <code className="jsx">{[
        '".../my_file.att./_insert/p/Hello"\n',
        '".../my_file.att./_insert"\n',
        '".../my_file.att./_insert/k/1a/p/Hello"\n',
        '".../my_file.att./_insert/k/1a/p/Hello/i/1"\n',
        '".../my_file.att./_deleteEntry/k/1a"\n',
        '".../my_file.att./_deleteList/lo/1a/hi/2a"\n',
        '".../my_file.att./_deleteList"\n',
        '".../my_file.att./entry/k/1a"\n',
        '".../my_file.att./list/n/1000"\n',
      ]}</code>
    </p>
    <p>
      Let us go through these examples one at a time. First we have a query of
      the type '_insert', and with a parameter 'p' with the value of "Hello".
    </p>
    <p>
      First of all, the underscore at the start of '_insert' tells the server
      that this route is "locked," which means that the query requires admin
      privileges. Admin privileges are generally only granted inside the
      execution of an SMF. There is also a way for the admin of a directory to
      make requests with admin privileges manually, which we will show in the
      <ILink key="link-tut-6-3" href="~/db-queries">
        next tutorial
      </ILink>.
      But other than that, admin privileges are only granted inside of SMFs,
      regardless of whether the requesting user is the admin or not.
    </p>
    <p>
      The ".../my_file.att./_insert/p/Hello" query has the effect of
      inserting a new entry into the 'my_file.att' table, with a "Hello" as
      the so-called "payload" of the entry, which is what the 'p' stands for.
      The payload of an entry is generally the part of the entry that is not
      part of any of its index keys. For the '.att' tables, the payload is thus
      just the "text_data" column that we saw above. Therefore, the
      ".../my_file.att./_insert/p/Hello" query will insert a new entry with
      an automatically generated ID and a text payload of "Hello".
    </p>
    <p>
      Now, since the valid characters of routes are heavily restricted, as they
      need to conform to the URL specification, it would not be very useful if
      we could only pass the texts for the '.att' tables via the parameters of
      such routes. Luckily, the "payload" parameter value in particular can
      also generally be passed via the post data of a post request, which is
      the optional second argument of the post() function that we saw above.
    </p>
    <p>
      This means that the following two post() calls will have the same effect
      (where the "..." in front of the routes is still just placeholder).
    </p>
    <p>
      <code className="jsx">{[
        'post(".../my_file.att./_insert/p/Hello");\n',
        'post(".../my_file.att./_insert", "Hello");',
      ]}</code>
    </p>
    <p>
      But with the second kind of query, we obviously have more freedom to
      insert the payload text that we want.
    </p>
    <p>
      Next we have the route of ".../my_file.att./_insert/k/1a/p/Hello",
      which is similar to the ones before, but with a 'k' parameter with the
      value of "1a" as well. The 'k' here stands for "key", and generally
      represents the primary key for the entry. In the case of '.att' files,
      this "key" is obviously the "text_id" column that we saw above. So the
      ".../my_file.att./_insert/k/1a/p/Hello" route will have the effect of
      inserting a entry with the specific (hexadecimal) key of "1a", and with
      a payload of "Hello" once again.
    </p>
    <p>
      The default behavior of '_insert' queries is to always overwrite an
      existing entry in case of a duplicate key. This is why the
      editMessage() SMF of messages.sm.js can be seen to also simply use an
      '_insert' query to edit a given message:
    </p>
    <p>
      <code className="jsx">{[
        'export async function editMessage(text) {\n',
        '  ...\n',
        '  let newStoredText = authorID + ";" + newText;\n',
        '  return await post(\n',
        '    abs("./messages.att./_insert/k/" + messageID),\n',
        '    newStoredText\n',
        '  );\n',
        '}',
      ]}</code>
    </p>
    <p>
      If instead wanting to ignore existing entries in case of a duplicate
      key, set the query parameter of 'i' to "1", as seen in the route of
      ".../my_file.att./_insert/k/1a/p/Hello/i/1" above. (For boolean query
      parameters like 'i', we use "1" and "0" rather than "true" and "false".)
    </p>
    <p>
      Next we have route of ".../my_file.att./_deleteEntry/k/1a", which of
      course has the effect of deleting the entry with the key of "1a".
    </p>
    <p>
      One can also delete whole sections of a table at once. The route of
      ".../my_file.att./_deleteList/lo/1a/hi/2a" thus has the effect of
      deleting all entries with a key between "1a" and "2a". And the route of
      ".../my_file.att./_deleteList" simply deletes all the entries of the
      table.
    </p>
    <p>
      Finally, we have two query types for fetching data from the table, namely
      the 'entry' query type, which fetches a particular entry, and 'list',
      which fetches a whole list.
    </p>
    <p>
      For instance, ".../my_file.att./entry/k/1a" will fetch the entry with
      the key of "1a". However, rather than returning the full array of the
      entry, which is of the form '[textID, textData]' for '.att' table
      entries, the textID will be omitted from the returned value, as this is
      already known by the requesting client. And since textData is the only
      column left in this entry, the column value will also be unwrapped from
      the array, meaning that the ".../my_file.att./entry/k/1a" query will
      return the textData directly, rather than returning a '[textData]' array.
    </p>
    <p>
      And if no entry exists of the given key, the 'entry' query will simply
      return null or undefined.
    </p>
    <p>
      For the 'list' queries, on the other hand, the full entries will be
      returned, meaning that return value of a 'list' query will be a
      (possibly empty) array of entry arrays of the form '[textID, textData]'.
    </p>
    <p>
      So for example, if the ".../my_file.att" table contains only three
      entries: '["1", "Foo"]', '["b", "Bar"]', '["1a", "Baz"]', we would get
      the following results.
    </p>
    <p>
      <code className="jsx">{[
        'fetch(".../my_file.att./entry/k/1a"); // Resolves to "Baz".\n',
        'fetch(".../my_file.att./entry/k/1b"); // Resolves to null.\n',
        'fetch(".../my_file.att./list/n/1000");\n',
        '// Resolves to [\n',
        '//   ["1", "Foo"],\n',
        '//   ["b", "Bar"],\n',
        '//   ["1a", "Baz"],\n',
        '// ].\n',
        'fetch(".../my_file.att./list/n/1000/o/1b"); // Resolves to [].\n',
      ]}</code>
    </p>
    <p>
      Here, the 'n' parameter for the 'list' query type is the maximal number
      of entries that the client wish to receive, and 'o' is the offset of the
      list.
    </p>
    {/* <p>
      Note also that neither 'entry' nor 'list' have an underscore in front,
      which means that these data-fetching queries do not generally require
      admin privileges. There is however exceptions to this, which we will get
      to in the next section.
    </p> */}
    <p>
      For more documentation and tips about the various database table
      files and their query parameters, see the
      <ILink key="link-tut-6-4" href="~/db-queries">
        next tutorial
      </ILink>.
    </p>
  </section>

  <section>
    <h2>Calling a server module function</h2>
    <p>
      To make a call to a given SMF from the client-side, we can use routes of
      the form
    </p>
    <p>
      <code className="jsx">{[
        '"ABSOLUTE_PATH_TO_SM_FILE./callSMF/FUN_NAME/(/ARG_1/ARG_2/...)?"',
      ]}</code>
    </p>
    <p>
      where ABSOLUTE_PATH_TO_SM_FILE is a placeholder for the absolute path to
      the '.sm.js' file in question, FUN_NAME is the alias of the exported SMF
      to call, and ARG_1, ARG_2, ... is an optional list of input values of
      optional length, where each argument will be treated as a string.
    </p>
    <p>
      Again, since the the valid characters of the route segments are
      restricted, passing the arguments this way puts a restriction on what
      values the SMF can receive. However, in the case of post() queries, the
      arguments can also be passed via the post data argument, i.e. the second
      argument of post(). This means that the following two post queries are
      equivalent.
    </p>
    <p>
      <code className="jsx">{[
        'post(".../my_file.sm.js./callSMF/myFun/foo/bar");\n',
        'post(".../my_file.sm.js./callSMF/myFun", ["foo", "bar"]);',
      ]}</code>
    </p>
    <p>
      And if only passing a single argument to an SMF, and that argument is
      not an array, one can also just pass the argument directly as the second
      argument of post(), without wrapping it in an array, which means that
      the following two post queries are also equivalent.
    </p>
    <p>
      <code className="jsx">{[
        'post(".../my_file.sm.js./callSMF/myFun/foo");\n',
        'post(".../my_file.sm.js./callSMF/myFun", "foo");',
      ]}</code>
    </p>
    <p>
      Passing the arguments via the post data argument, however, means that
      you can also pass values of other types apart from strings, such as
      numbers, booleans, arrays and plain objects. And as long as these values
      can be losslessly JSON-encoded, they will have the same values and types
      at the beginning of the SMF's execution.
    </p>
    <p>
      As an example... TODO: Show the user where the postMessage() is called
      from in PostField.jsx, and then show where the list is fetched, and
      possibly note that you can (and often want to) use fetch() for SMF calls. 
    </p>
  </section>

  <section>
    <h2>Privileges</h2>
    <p>
      When a function is executed, it can sometimes get elevated privileges
      under certain circumstances, which allows it to do things that would
      otherwise fail.
    </p>
    <p>
      The privileges are thus a type of flags that are raised for the execution
      environment of the given function, which might then be checked by some
      developer functions, such as post() and fetch(), at the beginning of
      their execution.
    </p>
    <p>
      The two main types of privileges to know about, which are the "admin"
      privilege, which we have already talked about above, and the "can-post"
      privilege.
    </p>

    <h4>The "admin" privilege</h4>
    <p>
      The "admin" privilege is raised only at the beginning of the execution
      of an SMF, and only if that SMF is called specifically via a
      "./callSMF" query, like we saw in the last section.
    </p>
    <p>
      The "admin" privilege allows for queries to so-called "locked" routes,
      which are all routes that contains a segment that starts with an
      underscore.
    </p>
    <p>
      Note that the so-called "query type" after a "./" also counts as a
      segment, which is why query types such as "_insert" and "_deleteEntry",
      etc., are all "locked," and therefore generally only works if they are
      used inside of an SMF. 
    </p>
    <p>
      Additionally, if any file name start with an underscore, all queries to
      that file (including its content in case of a text file) will be locked
      as well. And if the name of a subdirectory starts with an underscore,
      all the files within that subdirectory will be locked.
    </p>
    <p>
      This makes it possible for an app to have private data, which can only
      be read by an SMF, or by the admin.
    </p>
    <p>
      Note that admin privileges are <i>not</i> automatically granted to
      queries that originate from the admin of the given home directory, at
      least while using the browser to access their own app. The admin can,
      however, use the uploader program to make posts with elevated privileges,
      as we will show in the
      <ILink key="link-tut-6-5" href="~/db-queries">
        next tutorial
      </ILink>.
    </p>

    <h4>The "can-post" privilege</h4>
    <p>
      ...
    </p>
  </section>


    {/* <p>
      In order to read and write data to these database tables, the user can
      call one of the functions, post(), fetch(), or fetchPrivate(), from the
      'query' developer library. Each of these functions takes an extended path
      as its first argument, also referred to as a 'route.' The
      abs("./messages.att./_insert") argument that we saw above is an example
      of such a route. And post() can also receive some additional data via
      its second argument, which allows us to post data without having to
      always encode it as part of the route.
    </p> */}
    {/* <p>
      Apart from this, the difference between these three functions lies in
      which kinds of privileges they require.
    </p> */}
</div>;
