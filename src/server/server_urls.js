
const urlRoot = window.location.href.match(/^https?:\/\/[^:/]*/)[0];


export const ajaxServerDomainURL = urlRoot + ":8080";

export const loginServerDomainURL = urlRoot + ":8081";
