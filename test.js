



let x = Math.floor(Math.random() * 99999999999999999999)
while(x.toString().length == 19){
    console.log('Not done');
    x = Math.floor(Math.random() * 99999999999999999999)
}
console.log('done');