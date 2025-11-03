
const urlRoot = (typeof window === "undefined") ? "http://localhost" :
  window.location.href.match(/^https?:\/\/[^:/]*/)[0];


export const ajaxServerDomainURL = (urlRoot === "http://localhost") ?
  "http://localhost:8080" : urlRoot + "/ajax";

export const loginServerDomainURL = (urlRoot === "http://localhost") ?
  "http://localhost:8081" : urlRoot + "/login";
