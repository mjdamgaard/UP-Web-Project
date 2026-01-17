
// A test "app" to test async functions.

export function initialize() {
  runTests();
}

export function render() {
  return (
    <div>{
      "This test \"app\" just runs some tests in the console, namely for " +
      "testing async functions."
    }</div>
  );
}



async function runTests() {
  console.log("Running tests...");

  let res = test01();
  if (res !== 1) console.log("test01 error"); else console.log("true 01");

  test02().then(res => {
    if (res !== 1) console.log("test02 error"); else console.log("true 02.1");
  });
  res = await test02();
  if (res !== 1) console.log("test02 error"); else console.log("true 02.2");

  try {
    await test01();
  }
  catch (err) {
    if (err.message !== "Awaiting a non-promise value: 1")
      console.log("test03 error"); else console.log("true 03");
  }

  await test04();

  // TODO: Make more tests.
}


function test01() {
  return 1;
}

async function test02() {
  return 1;
}

async function test04() {
  let onePromise = test02();
  let fivePromise = new Promise(resolve => resolve(5));
  let seven = await onePromise * 2 + await fivePromise;
  if (seven !== 7) console.log("test04 error"); else console.log("true 04.1");

  let ten = seven;
  for (let i = await onePromise - 1; i < 3; i = i + await onePromise) {
    ten += await onePromise;
  }
  if (ten !== 10) console.log("test04 error"); else console.log("true 04.2");
}
