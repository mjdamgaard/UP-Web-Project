
import {substring} from 'string';
import {getAbsolutePath} from 'path';


// pushURL() and replaceURL() supports the regular path syntax, including
// urls starting with "/", "./", or "../", where "./" also removes the last
// segment if looks like a file name (orm ore precisely, if it contains a "."
// somewhere in its middle. Additionally, they support relative urls starting
// with "+", in which case what comes after the "+" is just appended straight
// to the current url.
// Furthermore, they support "~/" and even "~~/", which are similar to "./"
// and "../", but where you skip to a previous point of a "local home url,"
// which is defined by a component that, 1, has both a 'url' and not least a
// 'homeURL' prop, and 2, includes the actions and event that is defined below.
// Also, if the url does not match any of these things, for instance if it
// starts with an alphanumerical character, then this is treated equivalently
// as if "./" was prepended to it.

// TODO: Test that all these options work as intended.


export const urlActions = {
  // The pushState() and replaceState() here can be overwritten, as is done in
  // ./main.jsx.
  "pushState": function(stateAndURL) {
    return this.trigger("pushState", stateAndURL);
  },
  "replaceState": function(stateAndURL) {
    return this.trigger("replaceState", stateAndURL);
  },

  "pushURL": function(url) {
    if (substring(url, 0, 3) === "~~/") {
      return this.trigger("pushURL", substring(url, 1));
    }
    let {url: curURL, homeURL = ""} = this.props;
    url = getURL(url, curURL, homeURL);
    return this.do("pushState", [null, url]);
  },
  "replaceURL": function(url) {
    if (substring(url, 0, 3) === "~~/") {
      return this.trigger("replaceURL", substring(url, 1));
    }
    let {url: curURL, homeURL} = this.props;
    url = getURL(url, curURL, homeURL);
    return this.do("replaceState", [null, url]);
  },
  "getURL": function(url) {
    if (substring(url, 0, 3) === "~~/") {
      return this.trigger("getURL", substring(url, 1));
    }
    let {url: curURL, homeURL} = this.props;
    return getURL(url, curURL, homeURL);
  }
};

export const urlEvents = [
  "pushURL",
  "replaceURL",
  "getURL",
];



export function getURL(url, curURL = "/", homeURL = "") {
  if (substring(url, 0, 2) === "~/") {
    return (url === "~/") ?
      getAbsolutePath("/", homeURL || "/") :
      getAbsolutePath("/", homeURL + substring(url , 1));
  }
  else {
    return getAbsolutePath(curURL, url);
  }
}