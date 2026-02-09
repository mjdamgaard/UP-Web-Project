
import * as ILink from 'ILink.jsx';
import * as ELink from 'ELink.jsx';
import * as ComponentEntityComponent
from "../variable_components/ComponentEntityComponent.jsx";


export function render() {
  let userID = this.subscribeToContext("userID");
  // return pagePlaceholder;
  return getPage(userID);
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


const getPage = (userID) => <div className="text-page">
  <h1>Server modules</h1>
  <section>
    <h2>Introduction</h2>
    <p>
      When an app needs to store data on the server, it can do so by creating a
      server module (SM), which is a JS module whose exported
      functions are allowed to be executed server-side.
    </p>
    <p>
      The server modules are recognized by a special file extension of
      ".sm.js". Whenever you create a file with this extension in an uploaded
      directory, you
      tell the server the exported functions of that module is allowed to
      be executed on the server, at the request of a client.
    </p>
    <p>
      And whenever a server module function (SMF) is called this way, it is
      granted admin privileges on the given server-side home directory during
      the function's execution. This means that it is allowed to insert and
      delete data from the database tables associated with the directory,
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
      If you have already followed
      <ILink key="link-tut-1-1" href="~/getting-started">
        Tutorial 1
      </ILink>,
      and downloaded the GitHub repository at
      <ELink key="link-UPDirUploader"
        href="https://github.com/mjdamgaard/UPDirUpdater" >
        github.com/mjdamgaard/UPDirUpdater
      </ELink>,
      then you will see a directory called
      <ELink key="link-message_app"
        href="https://github.com/mjdamgaard/UPDirUpdater/tree/main/up_directories/message_app" >
        'up_directories/message_app'
      </ELink>
      next to the 'up_directories/hello_world' directory.
    </p>
    <p>
      Feel free to upload this 'message_app' app in the same way that you
      uploaded the 'hello_world' app in
      <ILink key="link-tut-1-2" href="~/getting-started">
        Tutorial 1
      </ILink>,
      if you want to try the app out in your own hands. (And at the end of this
      tutorial, there is an exercise you can try, where you will modify the
      app to make the messages private.)
    </p>
    <p>
      When this message app is uploaded, it should look as follows.
    </p>
    <p>
      <div className="text-frame">
        <ComponentEntityComponent key="app-example"
          compEntKey={"/1/1/em2.js;get/messageAppExample"} userID={userID}
        />
      </div>
    </p>
    <p>
      (Feel free to try out this copy of the app as well, by posting a
      message or two, provided that you are logged in.)
    </p>
    <p>
      The way that this app uploads and downloads data from the database is
      exclusively via calls to the server module located at
      <ELink key="link-messages-sm"
        href="https://github.com/mjdamgaard/UPDirUpdater/blob/main/up_directories/message_app/server/messages.sm.js" >
        'server/messages.sm.js'
      </ELink>.
    </p>
    <p>
      If you look inside this file, you will see the following four exported
      functions.
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
      Let us now take a closer look at the postMessage() SMF in this module.
      It reads
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
      The first thing that this SMF does is to call a function called
      'checkRequestOrigin()' in order to check that the request
      originated from the message app itself, which is defined by the
      'main.jsx' module in the same home directory. This is an important check
      to make as it prevents other apps from posting, editing,
      or deleting messages in this message app on behalf of the user.
    </p>
    <p>
      We will get more into how this checkRequestOrigin() function works below.
    </p>
    <p>
      The next thing that postMessage() does is then to get the (hexadecimal)
      ID of of the requesting user, and combine this with the input text,
      using ";" as a separator, before storing inserting it in the database.
    </p>
    <p>
      There are also other ways that we could store this data that are
      more efficient in terms of storage space.
      But for the sake of simplicity, we just store all the data as a single
      encoded text for this tutorial.
    </p>
    <p>
      Finally, postMessage() inserts the encoded text in the database via a
      call to a function called 'post(),' imported from the 'query' library:
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
      but with an additional string of "./_insert" appended to it as well.
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
      CAUTION: If you move or rename a database table file, or rename any of
      its parent subdirectories such that its file path relative to the
      server-side home directory changes, the
      uploader program will treat this as a deletion of the file as well, and
      the data in the table will also be deleted.
      {/* So be careful
      about changing the file structure of an app once it is already being
      used online by other users.
      {/* <ILink key="link-tut-6-1" href="~/db-queries">
        Tutorial 6
      </ILink>
      will teach you how you can safely move or rename a database table file
      without losing its data.  * /}
      (You should generally be careful about changing the file structure of
      a directory that is already being used by others.) */}
    </p>
    <p>
      The type of database table created depends on the extension of the given
      file.
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
      The data stored in a given database table file can be accessed and
      modified via a kind of extended paths to the file, similar to the
      abs("./messages.att./_insert") path that we saw above. We will also refer
      to such extended paths as 'routes.' The routes used to interact with
      database table files all have the following syntax.
    </p>
    <p>
      <code className="jsx">{[
        '"ABSOLUTE_PATH_TO_FILE./QUERY_TYPE(/PARAM/VALUE)*"',
      ]}</code>
    </p>
    <p>
      Here, ABSOLUTE_PATH_TO_FILE is a placeholder for the absolute path to the
      file, QUERY_TYPE is a placeholder for the type of the given query, such
      as the "_insert" type that we saw above, and PARAM and VALUE are a
      pair of respectively a parameter's name and its value.
    </p>
    <p>
      The "./" in such routes should thus be interpreted as essentially
      meaning: "Do something with this file (or directory)." Also note that
      file names and directory names are not allowed to end in '.' in this
      system, which means that any occurrence of "./" will always have this
      meaning.
    </p>
    <p>
      The standard way to make a query for a given route is to pass that route
      to one of the three main query functions exported from the 'query'
      library: post(), fetch(), or fetchPrivate(). The difference between
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
      ".../my_file.att" is a placeholder for the absolute path to some file
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
      such routes. Luckily, this particular payload parameter, 'p', can
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
      insert whichever payload text that we want.
    </p>
    <p>
      Next we have the route of ".../my_file.att./_insert/k/1a/p/Hello",
      which is similar to the first route, but with an additional 'k' parameter
      as well, set to "1a". The 'k' here stands for "key," and generally
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
      keys, set the query parameter of 'i' (for 'ignore') to "1", as seen in the route of
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
      of entries that the client wishes to receive, and 'o' is an offset, which
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
      To make a call to a given SMF from the client side, we can use routes of
      the form
    </p>
    <p>
      <code className="jsx">{[
        '"ABSOLUTE_PATH_TO_SM_FILE./callSMF/FUN_NAME(/ARG)*"',
      ]}</code>
    </p>
    <p>
      where ABSOLUTE_PATH_TO_SM_FILE is a placeholder for the absolute path to
      the '.sm.js' file in question, FUN_NAME is the alias of the exported SMF
      to call, and '(/ARG)*' is an optional list of input values, where each
      argument is treated as a string value.
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
      Passing the arguments via the post data argument also allows us to pass
      other types values than just the string type, such as
      numbers, booleans, arrays and plain objects. And as long as these values
      can be losslessly JSON-encoded, they will have the same values and types
      at the beginning of the SMF's execution.
    </p>
    <p>
      As an example of an SMF call, see the
      <ELink key="link-MessageList.jsx"
        href="https://github.com/mjdamgaard/UPDirUpdater/tree/main/up_directories/message_app/MessageList.jsx" >
        'MessageList.jsx'
      </ELink>
      component module of the message app, which fetches the list of messages
      via the following action named "refresh".
    </p>
    <p>
      <code className="jsx">{[
        '"refresh": function() {\n',
        '  let {userID} = this.props;\n',
        '  if (!userID) return;\n',
        '  fetch(\n',
        '    abs("./server/messages.sm.js./callSMF/fetchMessages/1000")\n',
        '  ).then(messageList => {\n',
        '    this.setState(state => ({...state, messageList: messageList}));\n',
        '  });\n',
        '},',
      ]}</code>
    </p>
    <p>
      This action first of all checks that the user is logged in, before
      calling the fetchMessages() SMF from the 'messages.sm.js' module to get
      the list of all messages.
    </p>
    <p>
      You can also see the
      <ELink key="link-PostField.jsx"
        href="https://github.com/mjdamgaard/UPDirUpdater/tree/main/up_directories/message_app/PostField.jsx" >
        'PostField.jsx'
      </ELink>
      and
      <ELink key="link-EditField.jsx"
        href="https://github.com/mjdamgaard/UPDirUpdater/tree/main/up_directories/message_app/EditField.jsx" >
        'EditField.jsx'
      </ELink>
      components for some other examples.
    </p>
  </section>


  <section>
    <h2>Request origins</h2>
    <p>
      Whenever an SMF is queried using either post() or fetchPrivate(), the
      so-called 'request origin' is recorded for the given query, which is a
      string that denotes where the query originated from.
    </p>
    <p>
      This is not unlike the
      <ELink key="link-moz-origin"
        href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin"
      >
        Origin header
      </ELink>
      for HTTP requests. But instead of containing a domain name or IP address,
      the request origin here contains a path/route to the
      component or the SMF that made the request, depending on whether the
      query originated from the client or the server side. 
    </p>

    <h4>Client-side requests</h4>
    <p>
      If the request is made from the client side, by some app, the request
      origin will typically be the path to the JSX component module of that
      app.
    </p>
    <p>
      This is for example the case for the message app introduced above, whose
      post()
      requests will all get the request origin set to the absolute path to
      the 'main.jsx' module that defines the app. And it is why all the SMFs
      in the 'message.sm.js' module that inserts, modifies, or deletes data
      from the database starts with the following call to check that the
      request originated from the same message app.
    </p>
    <p>
      <code className="jsx">{[
        'checkRequestOrigin(true, [\n',
        '  abs("../main.jsx"),\n',
        ']);',
      ]}</code>
    </p>
    <p>
      The first argument of this checkRequestOrigin() function is a boolean
      value that, if true, allows the client to override the check.
      (You generally want this value to be true whenever
      the SMF is open to requests from the client side, and not just from
      other SMFs.)
    </p>
    <p>
      And the second argument is an array of all the permitted request origins,
      which in this example is just the path to the root component of the
      message app.
    </p>
    <p>
      There are exceptions, however, where the request origin is not set to the
      root component of a given app. Whenever you allow a component to style
      itself, which is typically achieved by using a 'key' prop that starts
      with an underscore, as we learned in
      <ILink key="link-tut-3-1" href="~/styling">
        Tutorial 3
      </ILink>,
      the request origin of any requests made inside this self-styling
      component will be set to the path of that component instead.
    </p>
    <p>
      More precisely, whenever a component that does not style itself
      makes a request, the request origin will always be set to the nearest
      ancestor component that does.
    </p>
    <p>
      Note that this makes it possible for apps to import
      and use foreign components that are allowed to access foreign parts of
      the database, as long as those components just get to define their own
      style. 
    </p>
    <p>
      But for our message app example, no 'key' props with leading
      underscores are used anywhere, which means that the request origin will
      always be the path to the root component of the app.
    </p>


    <h4>Server-side requests</h4>
    <p>
      An SMF can also be queried by other SMFs, running on the server side.
    </p>
    <p>
      For such queries, the request origin will not be set to
      the path of any component module, but rather to the "./callSMF" route
      that was used to call the first of the two SMFs, i.e. the one that is now
      calling the second one.
    </p>
    <p>
      For example, if the first SMF was originally queried via a route of
      ".../fst_file.sm.js./callSMF/firstSMF/arg1/arg2", and that SMF
      makes a query to another SMF via some different route, such as
      ".../sec_file.sm.js./callSMF/secondSMF/arg1",
      the request origin that this second SMF will see is then given
      by that first route: ".../fst_file.sm.js./callSMF/firstSMF/arg1/arg2".
    </p>
    <p>
      It is worth mentioning here that checkRequestOrigin() function also
      allows for the use of a "*" wildcard at the end of the whitelisted
      routes. For SMF routes in particular, this means you do not need to
      match all potential arguments of the requesting SMF.
      For instance, if you want to accept all requests from a given
      SMF, you can make a check similar to the following one.
    </p>
    <p>
      <code className="jsx">{[
        'export async function secondSMF(arg1) {\n',
        '  checkRequestOrigin(false, [\n',
        '    ".../fst_file.sm.js./callSMF/firstSMF*",\n',
        '  ]);\n',
        '\n',
        '  ...\n',
        '}',
      ]}</code>
    </p>
    <p>
      By the way, whenever an SMF queries another SMF in a different home
      directory, the admin privileges will also shift for that
      query, meaning that the admin privileges granted to the first SMF will
      not bleed into the second one.
    </p>
  </section>


  <section>
    <h2>Admin privileges</h2>
    <p>
      When admin privileges are granted, typically at the beginning of the
      execution of a given SMF, they allow the SMF to make queries to "locked"
      routes, as we call them, but only if the route targets a file or
      directory within the same home directory where the SMF is located.
    </p>
    <p>
      A route is locked whenever it contains a query
      type that starts with an underscore, such as "_insert" or "_deleteEntry",
      or if it contains any segment at all that starts with an
      underscore, including subdirectory names and file names.
    </p>
    <p>
      So if a file name starts with an underscore, its contents are not
      visible to the public, but can only be read by the SMFs within the same
      home directory, or by the admin. And if a subdirectory name starts with
      an underscore, then all files within that directory is locked.
    </p>
    <p>
      This makes it possible for apps to have private data. For instance, if
      we take a look at the 'messages.att' file in the message app, we see
      that this does not have a leading underscore anywhere in its path, and is
      thus not locked. The query types such as "entry" and "list" will
      therefore not require any admin privileges, and will thus work from
      anywhere, meaning that the data is visible to all other apps.
      However, if we were to change its name to "_messages.att" instead, the
      data will now only be accessible from within an SMF in the same home
      directory, or by the admin.
    </p>
    <p>
      Note that admin privileges are <i>not</i> automatically granted
      when an admin is simply using their own app via a browser.
      However, if an admin want to make queries with elevated privileges,
      besides calling an SMF, they can use the uploader program to do so,
      as we will see in the
      <ILink key="link-tut-6-5" href="~/db-queries">
        next tutorial
      </ILink>.
    </p>
    <p>
      It is also worth noting that an admin of a home directory is always
      able to remove themselves as the admin, which means that they can
      no longer access any private data, or make any changes to the directory.
      And as we will at some point teach in a future tutorial, the admin can
      also even choose to hand over maintenance responsibilities to a user
      group of their choice, such that any subsequent updates are now voted
      on democratically by that user group.
    </p>
  </section>


  <section>
    <h2>Query functions</h2>
    <p>
      The three main functions to choose between when making a query to a
      given route are post(), fetch(), and fetchPrivate(),
      all three exported from the 'query' library. In this section, we will
      explain their differences in more detail.
    </p>

    <h4>The post() function</h4>
    <p>
      The post() function is the most permissive of the three. It allows for
      locked routes to be queried, provided that the appropriate admin
      privileges have been already granted, and it allows queries to make
      changes to the database.
    </p>
    <p>
      On the other hand, post() can only be called if the current execution
      environment already has the permission to make posts. This post
      permission is generally only granted on the client side if post() was
      called in response to
      some action by the user, such as a mouse click or a press of the Enter
      key. And on the server side, post() can only be called if the currently
      executing SMF was also called using post(), including if the SMF was
      called server-side by another SMF.
    </p>
    <p>
      The post() function also has an optional second argument for
      passing data along with the query, as we have seen examples of above.
    </p>
    <p>
      And lastly, the post() function keeps track of both the "request origin,"
      as introduced above, as well as the requesting user, meaning that
      functions such as checkRequestOrigin(), getRequestOrigin(), and
      getRequestingUserID(), all exported from the 'request' library, work
      for post() requests.
    </p>

    <h4>The fetchPrivate() function</h4>
    <p>
      The fetchPrivate() function has most of the same qualities as the post()
      function, with the exceptions that it does not have a second argument
      for passing post data to the request, and more importantly, is does not
      require any special post permission before it can be called.
    </p>
    <p>
      This makes it the ideal function for fetching private data, where you
      need to query locked routes, and where you potentially also need to check
      the ID of the requesting user, but where you do not need to change the
      state of the database at all.
    </p>

    <h4>The fetch() function</h4>
    <p>
      Finally we have the fetch() function, ideal for fetching any public data,
      where the database should not change as a response to the request.
      The fetch() function can only be called on routes that are not locked,
      and it does not record neither the request origin nor the user ID for the
      request.
    </p>
    <p>
      The reason for using fetch() rather than fetchPrivate() when fetching
      public data is first of all that fetch() generally consumes fewer
      resources. And furthermore, it also helps to clearly signal to other
      programmers that the fetched data is public, and therefore does not
      require special care when handling. 
    </p>
    {/* <p>
      So while a call to fetch() can in fact always be replaced by a call to
      fetchPrivate() in principle, at least when the user is logged in, it is
      best to use fetch() whenever the queried data is public.
    </p> */}
  </section>



  <section>
    <h2>Exercise</h2>
    <p>
      Now that you have learned how to make data private, why not have a go at
      modifying the message app such that the message thread is no longer open
      to the public.
    </p>
    <p>
      Hint: After having first uploaded the message app in the same way as
      shown in
      <ILink key="link-tut-1-3" href="~/getting-started">
        Tutorial 1
      </ILink>
      for the "Hello, World!" app, and checked that the newly uploaded app
      looks the same as the example above, go to the 'message.att' file in the
      'server' folder and rename it to '_message.att'. Then change all
      occurrences of 'message.att' to '_message.att' inside the 'message.sm.js'
      module, and change both the 'message.sm.js' and the 'MessageList.jsx'
      modules to use fetchPrivate() everywhere instead of fetch().
      Then add a checkRequestOrigin() and a getRequestingUserID() call at the
      beginning of fetchMessages(), such that it starts out the same way as
      postMessage(). (Without this request origin check, any other
      app would be able to fetch the same private data as well.)
      And finally, for both postMessage() and fetchMessages(), add
      whatever checks you like to the user ID in order to limit who can post
      and who can read the messages.
    </p>
    <p>
      Feel free to create another test account or two in order to test
      your new private message app. For instance, you could let your message
      app accept requests from two out of three of your test accounts, and then
      test the app by logging in and posting from different accounts.
    </p>
    <p>
      By the way, if you do not know what your user ID is, go to the account
      menu at the top right of the webpage (on up-web.org), and click the
      'Account' option. You will then see an overlay page where you can find
      your user ID under the 'User info' header.
    </p>
  </section>

</div>;
