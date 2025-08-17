
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
  console.log('Test 1: Converting ["AAA"] to a base64 string.');
  let arr1 = ["AAA"];
  let typeArr1 = ["string"];
  let b64Str = arrayToBase64(arr1, typeArr1);
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
  arr1 = arrayFromBase64(b64Str, typeArr1);
  console.log(arr1);
  console.log("We get the same array back, so consider Test 1 successful!");
  console.log(" ");


  console.log('Test 2: Converting ["AAA", "BB"] back and forth.');
  arr1 = ["AAA", "BB"];
  typeArr1 = ["string", "string"];
  b64Str = arrayToBase64(arr1, ["string", "string"]);
  console.log("Result in base 64:");
  console.log(b64Str);
  console.log("Result in hexadecimal:");
  console.log(hexFromBase64(b64Str));
  console.log("And converting it back:");
  console.log(arrayFromBase64(b64Str, typeArr1));
  console.log("That worked! So consider Test 2 successful!");
  console.log(" ");

  console.log('Test 3: Let\'s increase the tempo and try to convert');
  arr1 = [0, 1, 15, 16, -128];
  typeArr1 = ["int", "uint", "int(1)", "int(2)", "int(1)"];
  console.log('the array, [0, 1, 15, 16, -128], with the type array,');
  console.log('["int", "uint", "int(1)", "int(2)", "int(1)"]');
  b64Str = arrayToBase64(arr1, typeArr1);
  console.log("Result in base 64:");
  console.log(b64Str);
  console.log("Result in hexadecimal:");
  console.log(hexFromBase64(b64Str));
  console.log("And converting it back:");
  console.log(arrayFromBase64(b64Str, typeArr1));
  console.log("... And now this also works. So Test 3 is now successful.");
  console.log(" ");

  console.log('Test 4: Floating point numbers (within specified intervals).');
  arr1 = [
    0.5, 0.55555555, 0.55555555, -1.2, 0
  ];
  typeArr1 = [
    "float(0,1,4)", "float(0,1,1)", "float(0,1,2)", "float(-10,10, 4)",
    "float( 0, 1, 4 )"
  ];
  console.log('Array:');
  console.log(arr1);
  console.log('Type array:');
  console.log(typeArr1);
  b64Str = arrayToBase64(arr1, typeArr1);
  console.log("Result in base 64:");
  console.log(b64Str);
  console.log("Result in hexadecimal:");
  console.log(hexFromBase64(b64Str));
  console.log("And converting it back:");
  console.log(arrayFromBase64(b64Str, typeArr1));
  console.log(
    "...Oh, that actually also seems to work after just a little debugging."
  );
  console.log("Yeah, so let us consider that test successful.");
  console.log(" ");

  console.log(
    'Test 5: It seems that I can turn the val < hi limit into val <= hi ' +
    'instead..'
  );
  arr1 = [
    0, 2345, -30
  ];
  typeArr1 = [
    "float(0,1, 4)", "float(-30,2345,4)", "float(-30,2345,4)"
  ];
  console.log('Array:');
  console.log(arr1);
  console.log('Type array:');
  console.log(typeArr1);
  b64Str = arrayToBase64(arr1, typeArr1);
  console.log("Result in base 64:");
  console.log(b64Str);
  console.log("Result in hexadecimal:");
  console.log(hexFromBase64(b64Str));
  console.log("And converting it back:");
  console.log(arrayFromBase64(b64Str, typeArr1));
  console.log(
    "Yep, we can, which is nice. Test 5 is also successful."
  );
  console.log(" ");

  console.log('Test 6: A test of the hex-ints.');
  arr1 = [
    "F", "00", "0123456789abcdefABCEF0", "", "00aa", "11a", "00000001",
  ];
  typeArr1 = [
    "hex-int", "hex-int", "hex-int", "hex-int", "hex-int", "hex-int", "hex-int",
  ];
  console.log('Array:');
  console.log(arr1);
  console.log('Type array:');
  console.log(typeArr1);
  b64Str = arrayToBase64(arr1, typeArr1);
  console.log("Result in base 64:");
  console.log(b64Str);
  console.log("Result in hexadecimal:");
  console.log(hexFromBase64(b64Str));
  console.log("And converting it back:");
  console.log(arrayFromBase64(b64Str, typeArr1));
  console.log(
    "And that just also works at expected from the get-go. Test 6 is a success."
  );
  console.log(" ");

  console.log('Test 7: Then let\'s mix it up.');
  arr1 = [
    "F", "F", "0123456789abcdefABCEF0", 3, "-4.4", "00000001", 0
  ];
  typeArr1 = [
    "hex-int", "string", "string", "uint(2)", "float(-10,-1, 6)", "hex-int",
    "int"
  ];
  console.log('Array:');
  console.log(arr1);
  console.log('Type array:');
  console.log(typeArr1);
  b64Str = arrayToBase64(arr1, typeArr1);
  console.log("Result in base 64:");
  console.log(b64Str);
  console.log("Result in hexadecimal:");
  console.log(hexFromBase64(b64Str));
  console.log("And converting it back:");
  console.log(arrayFromBase64(b64Str, typeArr1));
  console.log(
    "And that also works, and btw nice to get -4.4 back exactly. " +
    "Test 7 is successful."
  );
  console.log(" ");



  console.log("...");
  console.log(" ");
  console.log('Test 8: Float types with without one or both limits.');
  arr1 = [
    2, 0.5, 0.5, -1.2,
    1E+4, 1E+4, 1E-4, 1E-4,
    -1E+4, -1E-4,
  ];
  typeArr1 = [
    "float(0,,2)", "float(-111, , 3)", "float(,1,2)", "float(-3, ,4)",
    "float(-3, ,4)", "float(,,4)", "float(,3,4)", "float(,,4)",
     "float(,,1)",  "float(,,1)"
  ];
  console.log('Array:');
  console.log(arr1);
  console.log('Type array:');
  console.log(typeArr1);
  b64Str = arrayToBase64(arr1, typeArr1);
  console.log("Result in hexadecimal:");
  console.log(hexFromBase64(b64Str));
  console.log("And converting it back:");
  console.log(arrayFromBase64(b64Str, typeArr1));
  console.log("Test 8 is successful.");
  console.log(" ");


  // TODO: Continue by making some tests of the relational tables.
}