const arr = [1, 2, 3, 4, 5];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


// arr.forEach(async (num) => {
//   console.log(num);
//   await sleep(2000);
// });

async function test() {
  // for (let i = 0; i < arr.length; i++) {
  //   console.log(arr[i]);
  //   await sleep(2000);
  // }
  for (const num of arr.reverse()) {
    console.log(num);
    await sleep(2000);
  }
}

test();