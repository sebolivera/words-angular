
let coordTest:[number, number] = [1, 2];
let closedSet: Set<string> = new Set<string>([coordTest.toString()]);
closedSet.add([3, 4].toString())

console.log(closedSet.has([1, 2].toString()));
console.log(closedSet);