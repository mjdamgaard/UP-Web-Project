
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';
import * as ComponentEntityComponent
from "../variable_components/ComponentEntityComponent.jsx";


export function render() {
  let userID = this.subscribeToContext("userID");
  // return pagePlaceholder;
  return page(userID);
}

const pagePlaceholder = <div className="text-page">
  <h1>{"Server modules"}</h1>
  <section>
    <h2>{"..."}</h2>
    <p>{
      "This tutorial is soon underway..."
    }</p>
  </section>
</div>;


const page = (userID) => <div className="text-page">
  <h1>Server modules</h1>
  <section>
    <h2>Introduction</h2>
    <p>
      When an app needs to store data on the server, it does so by creating a
      so-called server module (SM), which is a JS module whose exported
      functions are allowed to be executed server-side.
    </p>
    <p>
      The server modules are recognized by a special file extension of
      ".sm.js". Whenever you create a file with this extension, you
      tell the server the exported functions of that module is allowed to
      be executed on the server, at the request of a client.
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
    <p>
      ...
    </p>
    <p>
      <div className="text-frame">
        <ComponentEntityComponent key="app-example"
          compEntKey={"/1/1/em2.js;get/messageAppExample"} userID={userID}
        />
      </div>
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
      These are the SMFs that the client can call to respectively post new
      messages, delete or edit messages, or fetch a list of existing messages.
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
      Let us now start by looking at the postMessage() SMF first. It reads
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
      library. This is very important to do for all SMFs that insert or
      modify any data in the database, or fetch any private data.
    </p>
    <p>
      This particular call to checkRequestOrigin() checks that the origin of
      the request is the message app defined by the 'main.jsx' module in the
      same home directory.
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
      directory again.
    </p>
    <p>
      WARNING: If you move or rename a database table file, or rename any of
      its parent subdirectories such that its file path relative to the home
      directory changes, the
      uploader program will treat this as a deletion of the file, and will
      delete the data in the associated table. So be careful
      about changing the file structure of an app once it is already being
      used online by other users.
      {/* <ILink key="link-tut-6-1" href="~/db-queries">
        Tutorial 6
      </ILink>
      will teach you how you can safely move or rename a database table file
      without losing its data.  */}
      (You should generally be careful about changing the file structure of
      a directory that is already being used by others.)
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
      In other words, an '.att' file represents a simple table with only two
      columns, namely a 'text_id' and a 'text_data' column, where a unique
      'text_id' is automatically generated whenever the client does not specify
      it explicitly.
    </p>
    <p>
      There are also other kinds of database table files with different
      file extensions. These will all be introduced in the
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
      Here, ABSOLUTE_PATH_TO_FILE is a placeholder for the absolute path to the
      file, QUERY_TYPE is a placeholder for the type of the given query, such
      as the "_insert" query type that we saw above, and PARAM and VALUE are a
      pair of respectively a parameter name and corresponding input value.
    </p>
    <p>
      The './' in such routes should thus be interpreted as essentially
      meaning: "Do something with this file (or directory)." Also note that
      file names and directory names are not allowed to end with '.' in this
      system, which means that any occurrence of './' will always have this
      meaning.
    </p>
    <p>
      The standard way to make a query for a given route is the pass that route
      to one of the three main query functions exported from the 'query'
      library: post(), fetch(), and fetchPrivate(). The difference between
      these
      will be explained below.
      {/* three functions is that post(), unlike the two others, allows for
      data to be inserted or modified in the database. And fetchPrivate(),
      unlike fetch() allows SMFs to receive particular information about the
      request, such as who the requesting user is. The getRequestingUserID()
      function that we saw above will thus fail for a fetch() request, but not
      for a fetchPrivate() request. */}
    </p>
    <p>
      Here are a few examples of some valid routes for the '.att' files, where
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
        '".../my_file.att./list/a/1/n/1000"\n',
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
      inserting a new entry into the 'my_file.att' table, with a "Hello" string
      as the so-called 'payload' of the entry, which is what the 'p' stands for.
      The payload of an entry is generally the part of the entry that is not
      part of any of its index keys. For the '.att' tables, the payload is thus
      just the "text_data" column that we saw above. Therefore, the
      ".../my_file.att./_insert/p/Hello" query will insert a new entry with
      an automatically generated ID and a text payload of "Hello".
    </p>
    <p>
      Now, since the valid characters of routes are heavily restricted, as they
      need to conform to URL specifications, it would not be very useful if
      we could only pass the texts for the '.att' tables via the parameters of
      such routes. Luckily, the "payload" parameter value in particular can
      also be passed via the post data of a post request, which is
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
      insert whichever payload text we want.
    </p>
    <p>
      Next we have the route of ".../my_file.att./_insert/k/1a/p/Hello",
      which is similar to the ones before, but with a 'k' parameter with the
      value of "1a" as well. The 'k' here stands for "key", and generally
      represents the primary key for the entry. In the case of '.att' files,
      this "key" is simply the "text_id" column that we saw above (but using
      a hexadecimal encoding of the BIGINT UNSIGNED value). So the
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
      If instead wanting to ignore existing entries in case of duplicate
      keys, set the query parameter of 'i' to "1", as seen in the route of
      ".../my_file.att./_insert/k/1a/p/Hello/i/1" above. (For boolean query
      parameters like 'i', we use "1" and "0" rather than "true" and "false".)
    </p>
    <p>
      Next we have a route of ".../my_file.att./_deleteEntry/k/1a", which, as
      you might have guessed, has the effect of deleting the entry with the
      key of "1a".
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
      the 'entry' query type, which fetches a particular entry, and the 'list'
      query type, which fetches a whole list of entries at once.
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
      For 'list' queries, on the other hand, the full entries will be
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
        'fetch(".../my_file.att./list/a/1/n/1000");\n',
        '// Resolves to [\n',
        '//   ["1", "Foo"],\n',
        '//   ["b", "Bar"],\n',
        '//   ["1a", "Baz"],\n',
        '// ].\n',
        'fetch(".../my_file.att./list/a/1/n/1000/o/3"); // Resolves to [].',
      ]}</code>
    </p>
    <p>
      Here, the 'a' parameter is a boolean parameter
      for whether to sort the list in ascending rather than descending
      order, 'n' is the maximal number
      of entries that the client wish to receive, and 'o' is an offset, which
      is a number of how many entries to skip on the list.
      The fetch() function that is used here, by the way, is a function
      similar to post(), except it prevents the query from inserting or
      modifying data in the database.
    </p>
    <p>
      For more documentation about the various database table
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
    <p>
      TODO: Also talk about how an SMF can be called from another SMF, and
      that admin privileges then changes (and stress that the previous ones are
      removed). *Or maybe not; now I'm talking about that below.. *No, I still
      need to mention that SMFs can call other SMFs, and I should then also
      mention the admin privilege shift. *It would be a good idea to also..
      ..mention fetchPrivate() here, or maybe somewhere below.. ..I could maybe
      just talk about the three query functions here in this section.. ..Or
      maybe in a small section below..
    </p>
  </section>

  <section>
    <h2>Permissions</h2>
    <p>
      When a function is executed, it can sometimes get elevated permissions
      under certain circumstances, which allows it to do things that would
      otherwise fail.
    </p>
    {/* <p>
      A permission is thus a type of flag that is raised for the execution
      environment of the given function, which might then be checked by some
      developer functions, such as post() and fetch(), at the beginning of
      their execution.
    </p> */}
    <p>
      There are two main types of permissions to know about, which are the
      'admin privilege,' which we have already talked about above, and the
      'post permission.'
    </p>

    <h3>The admin privilege</h3>
    <p>
      The admin privilege is raised only at the beginning of the execution
      of an SMF, and only if that SMF is called specifically via a
      "./callSMF" query, like we saw in the last section. They are always
      associated with the particular home directory to which the SMF belongs,
      and grant certain rights only within that home directory.
    </p>
    <p>
      In particular, the admin privilege allows for queries to so-called
      "locked" routes, which are all routes that contains a segment that
      starts with an underscore.
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

    <h3>The post permission</h3>
    <p>
      The post permission, as the name suggests, gives a function the
      permission to make post requests, via the post() function as seen above.
    </p>
    <p>
      In the current JSX framework, the components do not always have the
      permission to make post requests to the server, but only in response to
      an action by the user, such as a mouse click or a press of the Enter key. 
    </p>
    <p>
      And more importantly, whenever a query is made via fetch() or
      fetchPrivate(), any existing post permission will be removed for the
      duration of the query. And this is true regardless of whether fetch()
      or fetchPrivate() is called on the client side or on the server side. 
    </p>

    <h3>Clearing permissions manually</h3>
    <p>
      Sometimes you might wish to clear a permission manually. This is
      particular useful if you want an SMF to be able to make a query that is
      dependent on user input, but does not want to bleed e.g. admin privileges
      and/or post permissions into such queries.
    </p>
    <p>
      Allowing admin privileges to bleed into functions controlled by the
      client of the request is obviously a big no-no, and should always be
      avoided.
    </p>
    <p>
      Permissions can be cleared using a call to one of the following three
      functions, also exported by the 'query' library: clearPermissions(),
      clearPrivileges(), and noPost().
    </p>
    <p>
      Use clearPermissions() to clear both admin privileges and post
      permissions, use clearPrivileges() to clear only admin privileges, but
      not post permissions, and use noPost() to only clear the post permission,
      although this is generally not advised when it comes to SMFs.
    </p>

    <h3>Calling a foreign SMF</h3>
    <p>
      Another way that the admin privileges are cleared is whenever an SMF
      calls another SMF, possibly from a different home directory.
    </p>
    <p>
      Whenever a "./callSMF" query is made from within an SMF, the current
      admin privileges will be cleared during the query, and replaced by the
      admin privilege of the home directory of the called SMF.
    </p>
    <p>
      So another good way to prevent bleeding admin privileges into the wrong
      functions within an SMF is to only use "./callSMF" queries when calling
      any foreign functions that depend on client input.
    </p>
  </section>

  <section>
    <h2>Request origins</h2>
    <p>
      Whenever an SMF is queried using either post() or fetchPrivate(), the
      so-called 'request origin' is also recorded for the query, which is a
      string that denoted from where the query originated, not unlike a
      the
      <ELink key="link-moz-origin"
        href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin"
      >
        Origin HTTP header
      </ELink>.
    </p>
    <p>
      But whereas an Origin HTTP header denotes the domain name or the IP
      address of the origin server of the current website, the request origin
      in this system denotes the particular app component or SMF from which the
      query originated.
    </p>

    <h3>Request origins of client-side requests</h3>
    <p>
      Whenever an app component makes a post() or a fetchPrivate() request to
      the server, the request origin is set to the file path of that
      component, or one of its ancestor components, depending on whether the
      requesting component defines its own style or not. If the component's
      style is defined by an ancestor component, then the module path of that
      ancestor component is used instead for the request origin. 
    </p>
    <p>
      For example, if consider the message app discussed above, one can see
      that the outer component of the app, defined by the 'main.jsx' module,
      is responsible for styling the whole app, namely since none of its
      descendant component instances use keys that start with an underscore.
      And as we recall from
      <ILink key="link-tut-3-1" href="~/styling">
        Tutorial 3
      </ILink>,
      this means that the app component never hands over the styling
      responsibility to any of its descendants.
    </p>
    <p>
      Therefore, for all post() or fetchPrivate() queries made by the message
      app the request origin will be set to the absolute path of the 'main.jsx'
      file.
    </p>
    <p>
      And indeed, this is why all the SMFs of the 'messages.sm.js' module that
      inserts or modifies data in the database starts with the following check.
    </p>
    <p>
      <code className="jsx">{[
        'checkRequestOrigin(true, [\n',
        '  abs("../main.jsx"),\n',
        ']);',
      ]}</code>
    </p>
    <p>
      The checkRequestOrigin() function takes a boolean value as its first
      argument, which determines whether the client is potentially able to
      override the check. (You generally want this boolean to be true whenever
      the SMF is open to requests from client side, and not just from
      a other, trusted SMFs.)
      And the second argument is an array of permitted request origins.
    </p>
    <p>
      The strings inside this array are also allowed to end in "*", by the way,
      in which case the "*" is treated as a wildcard, matching anything that
      comes after.
    </p>
    <p>
      These request origins checks are often crucial to include, since if it is
      left out, it means that all other apps on the UP Web is free to post to
      the SMF at will, which is rarely desired.
    </p>

    <h3>Request origins of server-side requests</h3>
    <p>
      As stated above, an SMF can also be called from other SMFs, including
      ones from other home directories.
    </p>
    <p>
      For such queries between two SMFs, the request origin will not be set to
      the path of any component module, but rather to the "./callSMF" route
      that was used to call the first of the two SMFs, i.e. the one who is now
      calling the second one. 
    </p>
    <p>
      For example, if the first SMF is called via a route of
      ".../my_file.sm.js./callSMF/mySMF/arg1/arg2", and that SMF then calls
      another SMF,
      then the request origin that the second SMF will see is given by
      the route to the first SMF: ".../my_file.sm.js./callSMF/mySMF/arg1/arg2".
    </p>
    <p>
      Note, however, that due to the fact that checkRequestOrigin() allows its
      whitelisted routes to end in a "*" wildcard, you do not need to match
      all potential arguments, but can just check for a string
      such as e.g. ".../my_file.sm.js./callSMF/mySMF*" instead.
    </p>
  </section>

  <section>
    <h2>Private data</h2>
    <p>
      It is important to note that the data contained in a database table file
      is visible to the public, unless the file name starts an underscore to
      denote it as a locked file, or if it is nested inside a directory that
      starts with an underscore.
    </p>
    <p>
      If not, the data can be queried via "./entry" or "./list" routes. And
      since these query types are not locked, they do not need admin
      privileges and can therefore be made directly from the client side,
      without using any SMF.
    </p>
    <p>
      For example, in the message app discussed above, the 'message.att' file
      is not locked, and can therefore also be queried directly from the client
      side, via fetch() calls such as
    </p>
    <p>
      <code className="jsx">{[
        'fetch(".../messages.att./list/a/1/n/1000"));',
      ]}</code>
    </p>
    <p>
      So if you want your app to have data that is private, for instance if
      you do not want anyone to be able to read a users messages, you should
      first of all make sure to prepend an underscore to the file name of the
      given database table file, and then handle reading data from that file
      via SMFs.
    </p>
    <p>
      When querying an SMF to read private data, you will then need to use
      either the fetchPrivate() or the post() function, exported from the
      'query' library. Unlike the fetch() function, both of these functions
      has the effect transmitting the ID of the requesting user, along with the
      request.
    </p>
    <p>
      This user ID can then be obtained by the called SMF via the
      getRequestingUserID() function that we have seen above, exported from the
      'request' library. And the SMF can then use this ID to check whether the
      user should be given access to the requested data from a locked file. 
    </p>
    <p>
      By the way, if you do not know what your user ID is, go to the account
      menu at the top right of the webpage (on up-web.org), and click the
      'Account' option. You will then see an overlay page where you can see
      your user ID under the 'User info' header.
    </p>
  </section>

  <section>
    <h2>Exercise</h2>
    <p>
      Now that you have learned how to make data private, why not have a go at
      modifying the message app such that the message board is no longer open
      to the public.
    </p>
    <p>
      Hint: After having first uploaded the message app in the same way as
      shown in
      <ILink key="link-tut-1-2" href="~/getting-started">
        Tutorial 1
      </ILink>
      for the "Hello, World!" app, and checked that the newly uploaded app
      looks the same as the example above, go to the 'message.att' file in the
      'server' folder and rename it to '_message.att'. Then change all
      occurrences of 'message.att' to '_message.att' inside the 'message.sm.js'
      module, and change both 'message.sm.js' and the 'MessageList.jsx' modules
      to use fetchPrivate() instead of fetch().
      Then modify the postMessage() and fetchMessages()
      SMFs within the 'message.sm.js' module by adding a call to
      getRequestingUserID() in order to get the user ID, followed by whatever
      check you want to make of that user ID.
    </p>
    <p>
      And feel free to create another test account or two in order to test
      your new private message app. For instance, you could let your message
      app accept requests from two out of three of your test accounts, and then
      test the app by logging in and posting from different accounts.
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
