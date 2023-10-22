const [numrows, numcols] = [8,8];

const Seasons = {
    FALL:'fall',
    WINTER:'winter',
    SPRING:'spring',
    SUMMER:'summer'
}

const TreeType = {
    NOTHING:'nothing',      // no tree
    ACORN:'acorn',          // an acorn
    TREE:'tree',            // a normal tree
    BURNING:'burning'       // burning tree
}

const SpecialObjects = {
    FALL:'homecoming',
    WINTER:'snow sculpture',
    SPRING:'green key',
}

class GameState {
    constructor(prev){
        if (prev === null){
            this.initialize();
        }
        else {
            this.copyState(prev);
        }
    }
    
    initialize(){
        // The game board
        // Not using nested fill because that produces shallow reference
        this.board = Array.from({length : numrows}, () => Array.from({length : numcols},() => new Tile()));
        
        // The current season
        this.season = Seasons.FALL;
        
        // The special pieces for each season
        this.homecoming = true;
        this.carnival = true;
        this.green_key = true;

        this.can_step_season = false;

        this.initialPopulate()
        
    }
    
    copyState(prev) {
        this.board = GameState.copyBoard(prev);
        this.season = prev.season;
        this.homecoming = prev.homecoming;
        this.carnival = prev.carnival;
        this.green_key = prev.green_key;
    }

    // Sets the initial tile conditions
    initialPopulate(){
        let treemap = initialTreeDistribution();
            for (let i = 0; i<numrows;i++){
                for (let j=0; j<numcols;j++){
                    this.board[i][j].initTrees(treemap[i][j]);
                }
            }
        
    // Hardcoded special locations
    // The fall, winter, spring corners

    // Fall
    this.board[0][0].initTrees(4);
    this.board[0][0].specialObject = SpecialObjects.FALL;

   // Spring
   this.board[numrows-1][0].initTrees(4);
   this.board[numrows-1][0].specialObject = SpecialObjects.SPRING;

   // Winter
   this.board[numrows-1][numcols-1].initTrees(4);
   this.board[numrows-1][numcols-1].specialObject = SpecialObjects.WINTER;
    
   // The summer corner
   this.board[0][numcols-1].initTrees(0);
   this.board[0][numcols-1].barren = true;
   for (let [i,j] of getNeighborIndices(0, numcols-1)){
       this.board[i][j].initTrees(0);
       this.board[i][j].barren = true;
       for (let [p,q] of getNeighborIndices(i,j)){
        this.board[p][q].initTrees(0);
       }
    }

    }

    // copy the board of the previous
    static copyBoard(prev){
        let newBoard = Array.from({length : numrows}, () => Array(numcols).fill(new Tile()));
        return newBoard;
    }

    stepSeason(){
        let seasonsArray = [Seasons.FALL, Seasons.WINTER, Seasons.SPRING, Seasons.SUMMER];
        this.season = seasonsArray[(seasonsArray.indexOf(this.season) + 1) % 4]
    }
}

class Tile {
    constructor() {
        this.trees = Array(4).fill(TreeType.NOTHING); // the trees on this tile
        this.permafrost = false; // whether this tile has permafrost
        this.storm = 0; // the remaining years of storm on this tile
        this.barren = false; // whether this tile is barren
        this.specialObject = null;
    }
    
    copyTile(prev){
        this.trees = prev.trees;
        this.permafrost = prev.permafrost;
        this.storm = prev.storm;
        this.barren = prev.barren;
    }

    // Used to initialize the tile with a set number of trees
    initTrees(numTrees){
        this.trees = Array(4).fill(TreeType.NOTHING);
        if (numTrees > 4 || numTrees < 0) throw "Too many trees";
        for (let i = 0; i<numTrees;i++){
            this.trees[i] = TreeType.TREE;
        }
    }

    numTrees(){
        for (let t=0;t<4;t++){
            if (this.trees[t] === TreeType.NOTHING){
                return t;
            }
        }
        return 4;
    }

    UIString(){
        let treeUI = Array(4);
        for (let i=0;i<4;i++){
            if (this.trees[i] === TreeType.TREE){
                treeUI[i] = '🌲'
            } else if (this.trees[i] === TreeType.ACORN){
                treeUI[i] = '🌱'
            } else if (this.trees[i] === TreeType.BURNING){
                treeUI[i] = '🔥'
            } else {
                treeUI[i] = '  '
            }
        }

        let weather = ' ';
        if (this.storm!=0){
            weather = '🌧️'
        }

        let specialObject = '  ';
        if (this.specialObject === SpecialObjects.FALL){
            specialObject = '💥';
        } else if (this.specialObject === SpecialObjects.WINTER){
            specialObject = '⛄';
        } else if (this.specialObject === SpecialObjects.SPRING){
            specialObject = '🎤';
        }

        return `${treeUI[0]} ${treeUI[1]}\n ${weather} \n${treeUI[2]}${specialObject}${treeUI[3]}`;
    }
}

// For a tile (i,j), return the indices of all adjacent tile
// Takes care of annoying edge cases
function getNeighborIndices(i,j){
    let neighbors = Array();
    for (let x=Math.max(i-1,0);x<Math.min(i+2, numrows);x++){
        for (let y=Math.max(j-1,0);y<Math.min(j+2, numcols);y++){
            // A tile is not its own neighbor
            if (!(x===i&&y===j)){         
                neighbors.push([x,y])
            }

        }
    }
    return neighbors;
}

// Initial tree distribution
// Simple for now, later will do a more complex probability distribution
function initialTreeDistribution(){
    
    // 40% chance of 1, 40% chance of 2, 20% chance of 3
    function randomNumTrees(){
        let percent = Math.floor(100*Math.random()); // 0 to 99
        if (percent < 40){
            return 1;
        } else if (percent < 80){
            return 2;
        }
        else return 3;
    }
    
    let res = Array.from({length : numrows}, () => Array(numcols).fill(0));
    for (let i=0;i<numrows;i++){
        for (let j=0;j<numcols;j++){
            res[i][j] = randomNumTrees();
        }
    }
    return res;
}

gameState = new GameState(null);

function handleClick(id){
    console.log(id)
}

function nextSeason(){
    gameState.stepSeason();
    updateTileDisplay();
}

function updateTileDisplay(){
    for (let i=0; i<numrows;i++){
        for (let j=0;j<numcols;j++){
            document.getElementById(i+""+j).innerHTML = gameState.board[i][j].UIString();
            document.getElementById(i+""+j).className = "tile tile-"+gameState.season;
            if (gameState.board[i][j].permafrost){
                document.getElementById(i+""+j).className = "tile tile-permafrost";
            }
            if (gameState.board[i][j].barren){
                document.getElementById(i+""+j).className = "tile tile-barren";
            }
        }
    }

    if (gameState.can_step_season){
        document.getElementById("next-season-button").innerHTML = "Next Season";
    } else {
        document.getElementById("next-season-button").innerHTML = "Run Season";
    }
}

updateTileDisplay()