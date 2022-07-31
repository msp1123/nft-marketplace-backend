



// let x = Math.floor(Math.random() * 99999999999999999999)
// while(x.toString().length == 19){
//     console.log('Not done');
//     x = Math.floor(Math.random() * 99999999999999999999)
// }
// console.log('done');

let a = [4, 5]

let n = {};
for (let i = 0; i < a.length; i++) {
    const e = a[i];
    
    n[`${e}`] = {
        a: 1,
        b: 2
    }
}

console.log(n);