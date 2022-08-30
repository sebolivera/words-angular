export const heuristic = (
  pos0: [number, number],
  pos1: [number, number]
): number => {
  let d1: number = Math.abs((pos1[0] - pos0[0]));
  let d2: number = Math.abs((pos1[1] - pos0[1]));
  return d1 + d2;
};

// Had to implement my own version as apparently nobody has a decent js one...?
export const pathFinderAStar = (
  start: [number, number],
  end: [number, number],
  inputGrid: any,
  maxIterations: number = 10000
): Array<[number, number]> => {
  let path: Array<[number, number]> = [];
  let grid: Array<Array<any>> = [];

  let openSet: Set<string> = new Set<string>([start.toString()]); //nodes to be evaluated
  let closedSet: Set<string> = new Set<string>([]); //nodes already checked

  let current: [number, number] = start;
  const heuristicTimesTen = (
    pos0: [number, number],
    pos1: [number, number]
  ): number => {
    let d1: number = Math.abs((pos1[0] - pos0[0]) * 10);
    let d2: number = Math.abs((pos1[1] - pos0[1]) * 10);
    return d1 + d2;
  };

  const updateNeighbors = (
    grid: Array<Array<any>>,
    pos: [number, number]
  ): void => {
    for (
      let i = pos[0] > 0 ? pos[0] - 1 : 0;
      i <= (pos[0] < grid.length - 1 ? pos[0] + 1 : grid.length - 1);
      i++
    ) {
      for (
        let j = pos[1] > 0 ? pos[1] - 1 : 0;
        j <= (pos[1] < grid[0].length - 1 ? pos[1] + 1 : grid[0].length - 1);
        j++
      ) {
        if (i !== pos[0] || j !== pos[1]) {
          grid[i][j].g = heuristicTimesTen([i, j], start);
          grid[i][j].h = heuristicTimesTen([i, j], end);
          grid[i][j].f = grid[i][j].h + grid[i][j].g;
        }
      }
    }
  };
  const initGrid = (grid: Array<Array<any>>) => {
    for (let i = 0; i < inputGrid.length; i++) {
      let row: Array<any> = [];
      for (let j = 0; j < inputGrid[0].length; j++) {
        row.push({
          g: 0,
          h: 0,
          f: 0,
          walkable: inputGrid[i][j],
          closedSet: false,
          parent: null,
        });
      }
      grid.push(row);
    }
    grid[start[0]][start[1]];
    grid[end[0]][end[1]];
  };
  initGrid(grid);
  updateNeighbors(grid, current);
  const getLowestFValue = (
    aSet: Set<string>,
    matrix: Array<Array<any>>
  ): [number, number] => {
    let x: number = parseInt(Array.from(openSet.values())[0].split(',')[0]);
    let y: number = parseInt(Array.from(openSet.values())[0].split(',')[1]);
    let minFCost: [number, number] = [x, y];
    for (let cell of aSet) {
      //horrible syntax, but basically gets the coordinates of the lowest f_cost out of the 'open' set
      let coords: number[] = cell.split(',').map((e) => parseInt(e));
      x = coords[0];
      y = coords[1];
      matrix[coords[0]][coords[1]].f < matrix[minFCost[0]][minFCost[1]].f
        ? (minFCost = [x, y])
        : (minFCost = minFCost);
    }
    return minFCost;
  };
  let safetyCounter: number = 0;
  while (safetyCounter < maxIterations) {
    //prevents endless runs of iteration in case the target isn't reachable
    //stop condition is if all the cells are closedSet, untested as of now
    if (openSet.size === 0) {
      //shouldn't happen, but it does :/
      openSet.add([...start].join(','));
    }
    let minFCostIndex: [number, number] = getLowestFValue(openSet, grid);
    if (minFCostIndex[0] === end[0] && minFCostIndex[1] === end[1]) {
      break;
    }
    current[0] = minFCostIndex[0];
    current[1] = minFCostIndex[1]; //fucking idiot typescript
    openSet.delete(current.toString());
    closedSet.add(current.toString());
    for (
      let i = current[0] > 0 ? current[0] - 1 : 0;
      i <= (current[0] < grid.length - 1 ? current[0] + 1 : grid.length - 1);
      i++
    ) {
      for (
        let j = current[1] > 0 ? current[1] - 1 : 0;
        j <=
        (current[1] < grid[0].length - 1 ? current[1] + 1 : grid[0].length - 1);
        j++
      ) {
        if (
          (i !== current[0] || j !== current[1]) &&
          grid[i][j].walkable &&
          !closedSet.has([i, j].toString())
        ) {
          if (
            !openSet.has([i, j].toString()) &&
            (i !== current[0] || j !== current[1])
          ) {
            grid[i][j].g = heuristicTimesTen([i, j], start);
            grid[i][j].h = heuristicTimesTen([i, j], end);
            grid[i][j].f = grid[i][j].h + grid[i][j].g;
            grid[i][j].parent = [...current];
            if (!openSet.has([i, j].toString())) {
              openSet.add([i, j].toString());
            }
          }
        }
      }
    }
    safetyCounter++;
  }
  let reversePathCell: Record<string, any> = {
    ...grid[current[0]][current[1]],
  };
  let c = 0;
  while (reversePathCell.parent) {
    reversePathCell = { ...grid[current[0]][current[1]] };
    if (
      !reversePathCell.parent ||
      (reversePathCell.parent[0] === current[0] &&
        reversePathCell.parent[1] === current[1])
    ) {
      break;
    }
    current = [reversePathCell.parent[0], reversePathCell.parent[1]];
    path.push([...current]);
    c++;
  }
  path.pop(); //excludes the starting cell
  path.unshift(end); //adds the player position that I accidently removed above
  return path;
};

export const getRandomInt = (max: number): number => {
  return Math.floor(Math.random() * max);
};

export const getRandomArbitrary = (min:number, max:number):number => {
  return Math.random() * (max - min) + min;
}


export const clamp = (
  value: number,
  min: number = 0,
  max: number = 100
): number => {
  return Math.min(max, Math.max(value, min));
};

export const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: any = 5,
  strokeColor: any = 'black',
  fill: Boolean = false,
  stroke: Boolean = true
): void => {
  let tStyle = ctx.strokeStyle;
  ctx.strokeStyle = strokeColor;
  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    radius = { ...{ tl: 0, tr: 0, br: 0, bl: 0 }, ...radius };
  }
  ctx.beginPath();
  ctx.lineWidth = 4;
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius.br,
    y + height
  );
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
  ctx.strokeStyle = tStyle;
  ctx.closePath();
};

export const titleCaseWord = (word: string):string=> {
  if (!word) {
    return word;
  }
  return word[0].toUpperCase() + word.substring(1).toLowerCase();
}