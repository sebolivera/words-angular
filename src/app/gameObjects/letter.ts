import Entity from "./entity";

export default class Letter extends Entity{
    constructor(public name: string, public x: number=-1, public y: number=-1, public size: number, public layerValue:number, public sprites: Array<string>, public isWalkable:boolean=true, public isPushable:boolean=true){
        super(name, x, y, size, layerValue, sprites);
        this.isWalkable = isWalkable;
        this.isPushable = isPushable;
    }

}