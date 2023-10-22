const [numrows, numcols] = [8,8];

const Seasons = {
    FALL:'fall',
    WINTER:'winter',
    SPRING:'spring',
    SUMMER:'summer'
}

const Actions = {   // An enum for actions, also storing button text for that action
    PLANT_ACORNS: "Let acorns fall",
    SPREAD_WILDFIRES_FALL: "Wildfire spreads",
    SPREAD_WILDFIRES_SUMMER: "Wildfire spreads!",
    EXTINGUISH_WILDFIRES: "Let it snow",
    PERMAFROST_SPREADS: "Let it freeze!",
    STORM_SPREAD_AND_TICK: "Storms move",
    ACORNS_GROW: "Acorns grow",
    GLOBAL_WARMING: "Global warming!",
    TILE_BARREN: "Desertification!",
    TO_FALL: "Onwards to fall",
    TO_WINTER: "Onwards to winter",
    TO_SPRING: "Onwards to spring",
    TO_SUMMER: "Onwards to summer",

}

const actions_in_order = [Actions.PLANT_ACORNS,
    Actions.SPREAD_WILDFIRES_FALL,
    Actions.TO_WINTER,
    Actions.EXTINGUISH_WILDFIRES,
    Actions.PERMAFROST_SPREADS,
    Actions.TO_SPRING,
    Actions.STORM_SPREAD_AND_TICK,
    Actions.ACORNS_GROW,
    Actions.TO_SUMMER,
    Actions.GLOBAL_WARMING,
    Actions.TILE_BARREN,
    Actions.SPREAD_WILDFIRES_SUMMER,
    Actions.TO_FALL];

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

const global_warming_targets = 3;
const storm_dissipation_probability = 0.33;

class GameState {
    constructor(){
        this.initialize();
        this.action_map = new Map();
        this.action_map.set(Actions.PLANT_ACORNS, "this.plantAcorns()");
        this.action_map.set(Actions.SPREAD_WILDFIRES_FALL, "this.spreadWildfire()");
        this.action_map.set(Actions.TO_WINTER, "this.stepSeason()");
        this.action_map.set(Actions.EXTINGUISH_WILDFIRES, "this.extinguishWildfires()");
        this.action_map.set(Actions.PERMAFROST_SPREADS, "this.spreadPermafrost()");
        this.action_map.set(Actions.TO_SPRING, "this.stepSeason()");
        this.action_map.set(Actions.STORM_SPREAD_AND_TICK, "{this.spreadStorms(); this.tickStorms();}");
        this.action_map.set(Actions.ACORNS_GROW, "this.growAcorns()");
        this.action_map.set(Actions.TO_SUMMER, "this.stepSeason()");
        this.action_map.set(Actions.GLOBAL_WARMING, "this.causeGlobalWarming()");
        this.action_map.set(Actions.TILE_BARREN, "this.makeTilesBarren()");
        this.action_map.set(Actions.SPREAD_WILDFIRES_SUMMER, "this.spreadWildfire()");
        this.action_map.set(Actions.TO_FALL, "this.stepSeason()");
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

        this.next_action = Actions.PLANT_ACORNS;

        this.initialPopulate()
        
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
   this.board[0][numcols-1].is_barren = true;
   for (let [i,j] of getNeighborIndices(0, numcols-1)){
       this.board[i][j].initTrees(0);
       this.board[i][j].is_barren = true;
       for (let [p,q] of getNeighborIndices(i,j)){
        this.board[p][q].initTrees(0);
       }
    }

    }

    stepSeason(){
        let seasonsArray = [Seasons.FALL, Seasons.WINTER, Seasons.SPRING, Seasons.SUMMER];
        this.season = seasonsArray[(seasonsArray.indexOf(this.season) + 1) % 4]
    }

    plantAcorns(){
        for (const row of this.board){
            for (const tile of row){
                if (!tile.is_barren && !tile.has_permafrost && tile.numTrees()!=0){
                    tile.plantAcorn();
                    
                }
            }
        }
    }

    spreadWildfire(){
        let to_set_on_fire = new Array();
        for (let i = 0; i<numrows;i++){
            for (let j=0; j<numcols;j++){
                if (this.board[i][j].isBurning){
                    const neighbors = getNeighborIndices(i,j).map((nb)=>this.board[nb[0]][nb[1]]);
                    const valid_neighbors = neighbors.filter((tile)=>tile.numTrees()>0 && tile.storm === 0);
                    if (valid_neighbors.length>0){
                        const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                        to_set_on_fire.push(randomNeighbor);
                    }
                    this.board[i][j].burnDown();
                    this.board[i][j].growFire();
                }
            }   
        }
        for (const tile of to_set_on_fire){
            tile.growFire();
        }
    }

    extinguishWildfires(){
        for (const row of this.board){
            for (const tile of row){
                tile.extinguishFire();
            }
        }
    }

    spreadPermafrost(){
        const to_freeze = new Array();
        for (let i = 0; i<numrows;i++){
            for (let j=0; j<numcols;j++){
                // If not barren, and surrounded by three neighbors with permafrost, gain permafrost
                if (!this.board[i][j].is_barren && !this.board[i][j].has_permafrost){
                    const neighbors = getNeighborIndices(i,j).map((nb)=>this.board[nb[0]][nb[1]]);
                    const frozen_neighbors = neighbors.filter((tile) => tile.has_permafrost);
                    if (frozen_neighbors.length >= 3){
                        to_freeze.push(this.board[i][j]);
                    }
                }
            }   
        }
        for (const tile of to_freeze){
            tile.has_permafrost = true;
        }
    }

    spreadStorms(){
        const to_storm = new Array();
        for (let i = 0; i<numrows;i++){
            for (let j=0; j<numcols;j++){
                if (this.board[i][j].storm > 0){
                    const neighbors = getNeighborIndices(i,j).map((nb)=>this.board[nb[0]][nb[1]]);
                    const valid_neighbors = neighbors.filter((tile) => tile.storm === 0);
                    if (valid_neighbors.length > 0){
                        const randomNeighbor = valid_neighbors[Math.floor(Math.random() * valid_neighbors.length)];
                        to_storm.push(randomNeighbor);
                    }
                }
            }   
        }
        for (const tile of to_storm){
            tile.storm = 2;    
        }
    }

    tickStorms(){
        for (const row of this.board){
            for (const tile of row){
                if (tile.storm > 0){
                    tile.storm--;

                }
            }
        }
    }

    growAcorns(){
        for (const row of this.board){
            for (const tile of row){
                if (tile.storm > 0){
                    tile.growTileAcorns();
                }
            }
        }
    }

    causeGlobalWarming(){
        // Disspiating storms
        for (const row of this.board){
            for (const tile of row){
                if (tile.storm > 0){
                    if (Math.random() < storm_dissipation_probability){tile.storm = 0};
                }
            }
        }

        // Causing wildfires
        let neighbors_of_treeless_tiles = new Array();

        for (let i = 0; i<numrows;i++){
            for (let j=0; j<numcols;j++){
                if (this.board[i][j].numTrees() === 0){
                    const neighbors = getNeighborIndices(i,j).map((nb)=>this.board[nb[0]][nb[1]]);
                    neighbors_of_treeless_tiles = neighbors_of_treeless_tiles.concat(neighbors);
                }
            }
        }
        
        // Removing duplicates from neighbors
        neighbors_of_treeless_tiles = [...new Set(neighbors_of_treeless_tiles)];
        
        const valid_targets = neighbors_of_treeless_tiles.filter((tile) => tile.numTrees() > 0 && tile.storm === 0);


        const chosen_targets = new Array();
        for (let i = 0; i<global_warming_targets;i++){
            if (valid_targets.length === 0){break;}
            let new_target = valid_targets[Math.floor(Math.random() * valid_targets.length)];
            valid_targets.splice(valid_targets.indexOf(new_target),1);
            chosen_targets.push(new_target);
        }

        for (const target of chosen_targets){
            target.growFire();
        }

    }

    makeTilesBarren(){
        const to_make_barren = new Array();
        for (let i = 0; i<numrows;i++){
            for (let j=0; j<numcols;j++){
                if (!this.board[i][j].is_barren && this.board[i][j].numTrees() === 0){
                    const neighbors = getNeighborIndices(i,j).map((nb)=>this.board[nb[0]][nb[1]]);
                    const treeless_neighbors = neighbors.filter((tile) => tile.numTrees() === 0);
                    if (neighbors.length === treeless_neighbors.length){
                        to_make_barren.push(this.board[i][j]);
                    }
                }
                
            }   
        }
        for (const tile of to_make_barren){
            tile.is_barren = true;
        }
    }

    doNextAction(){
        // This is really hacky but I can't think of a better way to do this right now
        // I'm having trouble simply passing a reference to the methods
        eval(this.action_map.get(this.next_action));
    }
}


class Tile {
    constructor() {
        this.trees = Array(4).fill(TreeType.NOTHING); // the trees on this tile
        this.has_permafrost = false; // whether this tile has permafrost
        this.storm = 0; // the remaining years of storm on this tile
        this.is_barren = false; // whether this tile is barren
        this.specialObject = null; // if any special object is on this tile
        this.isBurning = false; // whetehr this tile is burning
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

    plantAcorn(){
        for (let t=0;t<4;t++){
            if (this.trees[t] === TreeType.NOTHING){
                this.trees[t] = TreeType.ACORN;
                break;
            }
        }
    }

    growFire(){
        // Fire can't spread to permafrost tiles
        // But attempting to do so melts the permafrost
        if (this.has_permafrost){
            this.has_permafrost = false;
            return;
        }

        // All acorns are destroyed
        for (let t=0;t<4;t++){
            if (this.trees[t] === TreeType.ACORN){
                this.trees[t] = TreeType.NOTHING;
            }
        }

        // If no tree is left, do nothing more
        if (this.numTrees() === 0){
            return;
        }
        
        // Set the last slot which is a tree
        // By last, I mean the it is followed either by nothing or fire
        for (let t=0;t<4;t++){
            if (t===3 && this.trees[3]===TreeType.TREE){
                this.trees[3] = TreeType.BURNING;
            } else if ((this.trees[t]===TreeType.TREE)
            &&(this.trees[t+1]===TreeType.NOTHING||this.trees[t+1]===TreeType.BURNING)){
                this.trees[t]= TreeType.BURNING;
                break;
            }
        }
        this.isBurning = true;
    }

    burnDown(){
        for (let t=0;t<4;t++){
            if (this.trees[t] === TreeType.BURNING){
                this.trees[t] = TreeType.NOTHING;
            }
        }
        if (this.numTrees() === 0){
            this.isBurning = false;
        }
    }

    extinguishFire(){
        for (let t=0;t<4;t++){
            if (this.trees[t] === TreeType.BURNING){
                this.trees[t] = TreeType.TREE;
            }
        }
        this.isBurning = false;
    }

    growTileAcorns(){
        for (let t=0;t<4;t++){
            if (this.trees[t] === TreeType.ACORN){
                this.trees[t] = TreeType.TREE;
            }
        }
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

var gameState = new GameState();

function handleClick(id){
   let [i,j] = id.split("");
   gameState.board[i][j].storm = 1;
   updateTileDisplay();
}

function doNextAction(){
    gameState.doNextAction();
    gameState.next_action = actions_in_order[(actions_in_order.indexOf(gameState.next_action) + 1)%actions_in_order.length];
    updateTileDisplay();
}

function updateTileDisplay(){
    for (let i=0; i<numrows;i++){
        for (let j=0;j<numcols;j++){
            document.getElementById(i+""+j).innerHTML = gameState.board[i][j].UIString();
            document.getElementById(i+""+j).className = "tile tile-"+gameState.season;
            if (gameState.board[i][j].has_permafrost){
                document.getElementById(i+""+j).className = "tile tile-permafrost";
            }
            if (gameState.board[i][j].is_barren){
                document.getElementById(i+""+j).className = "tile tile-barren";
            }
        }
    }

    document.getElementById("next-season-button").innerHTML = gameState.next_action;
    document.getElementById("next-season-button").onclick = doNextAction;
}

updateTileDisplay()