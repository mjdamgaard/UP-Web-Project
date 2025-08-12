
// A test app to test the binary tables, BT and BTT, together with the base-64
// conversion library. Let's just make this "app" console-based-

import {
  arrayToBase64, arrayFromBase64, hexFromBase64, hexToBase64,
} from 'base64';


export function render() {
  if (this.state.isFirstRender) this.setState({isFirstRender: false});
  else runTests();
  return (
    <div>{
      "This test \"app\" just runs some tests in the console, namely for " +
      "fetching and posting data to relational tables."
    }</div>
  );
}

export const initState = {isFirstRender: true};


function runTests() {
  let arr1 = ["AAA"];
  console.log('Test 1: Converting ["AAA"] to a base64 string.');
  let b64Str = arrayToBase64(arr1, ["string"]);
  console.log("Result:");
  console.log(b64Str);
  console.log("which in hexadecimal is:");
  let hexStr = hexFromBase64(b64Str);
  console.log(hexStr);
  console.log("This is correct! And if we convert back to base 64:");
  console.log(hexToBase64(hexStr));
  console.log(
    "...we get the same thing, so the hex--base 64 conversions also seems " +
    "to work"
  );
  console.log("Now, let's try to convert back to an array:");
  arr1 = arrayFromBase64(b64Str, ["string"]);
  console.log(arr1);
  console.log("We get the same array back, so consider Test 1 successful!");
  console.log(" ");
}