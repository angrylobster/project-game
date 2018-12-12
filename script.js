var array = [];
var ranNum = Math.floor(Math.random()*7) + 1
while (array.length < 8){
    while (array.includes(ranNum)){
        ranNum = Math.floor(Math.random()*7)+1
    }
    array.push(ranNum)
}
