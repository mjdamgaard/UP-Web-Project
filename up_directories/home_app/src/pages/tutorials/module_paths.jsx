
  <section>
    <h2>{"Module paths"}</h2>
    <p>{
      "It is important to note, however, that the paths in the import " +
      "statements, like the one seen " +
      "above, must be relative paths that stay within the directory that " +
      "you have uploaded."
    }</p>
    <p>{
      "That is, unless you want to import components (or " +
      "functions, etc.) from another directory altogether, either another " +
      "one of yours, or of another user."
    }</p>
    <p>{
      "In that case, you need " +
      "to use the absolute path to the foreign module, not in relation to " +
      "your local file system, but to the server-side file system. This " +
      "means that the absolute paths should be of the form " +
      "\"/<UP node ID>/<home directory ID>/<path from that directory>\". " +
      "Here <UP node ID> is the ID of the UP node, which in the case of " +
      "up-web.org is just \"1\". " +
      "And <home directory ID> is the ID that was assigned to the uploaded " +
      "directory. (You can see this when you upload or re-upload your " +
      "directory.)"
    }</p>
    <p>{
      "For instance, if someone wants to import your new app2.jsx " +
      "component, and your home directory ID is, say, \"123ab\", " +
      "they could import it via the following statement."
    }</p>
    <p>
      <code className="jsx">
        {'import * as App from "/1/123ab/app2.jsx";'}
      </code>
    </p>
  </section>