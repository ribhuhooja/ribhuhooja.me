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
    PERMAFROST_SPREADS: "Permafrost spreads",
    STORM_SPREAD_AND_TICK: "Storms move",
    ACORNS_GROW: "Acorns grow",
    GLOBAL_WARMING: "Global warming!",
    TILE_BARREN: "Desertification!",
    TO_FALL: "Onwards to fall",
    TO_WINTER: "Onwards to winter",
    TO_SPRING: "Onwards to spring",
    TO_SUMMER: "Onwards to summer",
    INVOKE_PERMAFROST: "Choose a tile to freeze",
    INVOKE_STORM: "Choose a tile, with at least one tree on it, o produce a storm on",
    FALL_ACTION: "Choose a tile, adjacent to a tile with four trees, to plant an acorn on OR extinguish wildfire on"

}

const actions_in_order = [Actions.FALL_ACTION,
    Actions.PLANT_ACORNS,
    Actions.SPREAD_WILDFIRES_FALL,
    Actions.TO_WINTER,
    Actions.EXTINGUISH_WILDFIRES,
    Actions.INVOKE_PERMAFROST,
    Actions.PERMAFROST_SPREADS,
    Actions.TO_SPRING,
    Actions.STORM_SPREAD_AND_TICK,
    Actions.INVOKE_STORM,
    Actions.ACORNS_GROW,
    Actions.TO_SUMMER,
    Actions.GLOBAL_WARMING,
    Actions.TILE_BARREN,
    Actions.SPREAD_WILDFIRES_SUMMER,
    Actions.TO_FALL];

const player_actions = [Actions.INVOKE_PERMAFROST,  Actions.INVOKE_STORM, Actions.FALL_ACTION]

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
        this.season = Seasons.SUMMER;
        
        // The special pieces for each season
        this.homecoming = true;
        this.carnival = true;
        this.green_key = true;

        this.next_action = Actions.GLOBAL_WARMING;
        this.years_survived = -1;

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
        if (this.season === Seasons.FALL){
            this.years_survived++;
        }
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
                if (tile.storm > 0 && !tile.has_permafrost){
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
            if (tile.specialObject != null){
                if (tile.specialObject === SpecialObjects.FALL){
                    this.homecoming = false;
                } else if (tile.specialObject === SpecialObjects.WINTER){
                    this.carnival = false;
                } else {
                    this.green_key = false;
                }
                tile.specialObject = null;
            }
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

    // Trees are always filled from the left to the right in the array, and removed in the same order
    // So the first time we enconter an element that is not a tree, we know all trees are to the
    // left of that element in the array
    numTrees(){
        for (let t=0;t<4;t++){
            if (this.trees[t] != TreeType.TREE){
                return t;
            }
        }
        return 4;
    }

    // What to display on each tile
    // Complete hack - I'm using emojis to display tile state
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
        if (this.isBurning){return;}

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
                neighbors.push([x,y]);
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
    i = parseInt(i);
    j = parseInt(j);
    let action_taken = false;

    // No action on barren tiles
    if (gameState.board[i][j].is_barren){return;}

    if (player_actions.includes(gameState.next_action)){
        if (gameState.next_action === Actions.INVOKE_PERMAFROST){
            gameState.board[i][j].has_permafrost = true;
            action_taken = true;
        } else if (gameState.next_action === Actions.INVOKE_STORM && gameState.board[i][j].numTrees() > 0 && gameState.board[i][j].storm === 0){
            gameState.board[i][j].storm = 1;
            action_taken = true;
        } else if (gameState.next_action === Actions.FALL_ACTION){
            const neighbors = getNeighborIndices(i,j).map((nb)=>gameState.board[nb[0]][nb[1]]);
            for (const neighbor of neighbors){
                if (neighbor.numTrees() === 4){

                    // If on fire, extinguish the fire
                    if (gameState.board[i][j].isBurning){
                        gameState.board[i][j].extinguishFire();
                        action_taken = true;
                    }
                    // If there is space to plant an acorn, plant an acorn
                    else if (gameState.board[i][j].trees[3] === TreeType.NOTHING){
                        console.log("here");
                        gameState.board[i][j].plantAcorn();
                        action_taken = true;
                    }
                }
            }
        }

        if (action_taken){
            gameState.next_action = actions_in_order[(actions_in_order.indexOf(gameState.next_action) + 1)%actions_in_order.length];
        }
    }
    updateTileDisplay();
}

function doNextAction(){
    gameState.doNextAction();
    gameState.next_action = actions_in_order[(actions_in_order.indexOf(gameState.next_action) + 1)%actions_in_order.length];
    if (document.getElementById("action-specific-text").className === "visible"){
        document.getElementById("action-specific-text").className = "invisible";
    }
    
    // If the next action is a player action, but it can't be taken due to some reason, skip it and write the reason
    if (player_actions.includes(gameState.next_action)){
        if (gameState.next_action === Actions.INVOKE_PERMAFROST){
            if (!gameState.carnival){
                document.getElementById("action-specific-text").className = "visible";
                document.getElementById("action-specific-text").innerHTML = "Since the snow sculpture has been destroyed, you can't take an action";
                gameState.next_action = actions_in_order[(actions_in_order.indexOf(gameState.next_action) + 1)%actions_in_order.length];
            }
        } else if (gameState.next_action === Actions.INVOKE_STORM){
            if (!gameState.green_key){
                document.getElementById("action-specific-text").className = "visible";
                document.getElementById("action-specific-text").innerHTML = "Since the green key concert has been destroyed, you can't take an action";
                gameState.next_action = actions_in_order[(actions_in_order.indexOf(gameState.next_action) + 1)%actions_in_order.length];
            } else {
                // If no tile has a tree, we can't cause a storm
                let tiles_with_trees = gameState.board.flat().filter((tile)=>tile.numTrees()>0);
                if (tiles_with_trees.length === 0){
                    document.getElementById("action-specific-text").className = "visible";
                    document.getElementById("action-specific-text").innerHTML = "There are no possible tiles to spread storm on";
                    gameState.next_action = actions_in_order[(actions_in_order.indexOf(gameState.next_action) + 1)%actions_in_order.length];
                }
            }

        }
        else if (gameState.next_action === Actions.FALL_ACTION){
            if (!gameState.homecoming){
                document.getElementById("action-specific-text").className = "visible";
                document.getElementById("action-specific-text").innerHTML = "Since the homecoming bonfire has been destroyed, you can't take an action";
                gameState.next_action = actions_in_order[(actions_in_order.indexOf(gameState.next_action) + 1)%actions_in_order.length];
            } else {
                console.log("here");
                // We also need to check if there is a valid tile
                let four_tree_tile_indices = Array();
                for (let i=0;i<numrows;i++){
                    for (let j=0;j<numcols;j++){
                        if (gameState.board[i][j].numTrees() === 4){
                            four_tree_tile_indices.push([i,j]);
                        }
                    }
                }
                let neighbor_indices = four_tree_tile_indices.map((tile)=>getNeighborIndices(tile[0], tile[1])).flat();
                let neighbors = neighbor_indices.map((nbi) => gameState.board[nbi[0]][nbi[1]]);
                let valid_neighbors = neighbors.filter((nb) => nb.isBurning ||nb.trees[3] === TreeType.NOTHING);
                valid_neighbors = valid_neighbors.filter((nb)=>!(nb.is_barren || nb.has_permafrost));
                if (valid_neighbors.length === 0){
                    document.getElementById("action-specific-text").className = "visible";
                    document.getElementById("action-specific-text").innerHTML = "There are no possible tiles to take an action on";
                    gameState.next_action = actions_in_order[(actions_in_order.indexOf(gameState.next_action) + 1)%actions_in_order.length];
                }
            }
        }   
    
    }
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

    document.getElementById("years-survived").innerHTML = "Years Survived: " + Math.max(0, gameState.years_survived);

    if (player_actions.includes(gameState.next_action)){
        document.getElementById("next-season").className = "invisible";
        document.getElementById("player-action-text").className = "visible";
        
        document.getElementById("player-action-text").innerHTML = gameState.next_action;
    } else {
        document.getElementById("next-season").className = "visible";
        document.getElementById("player-action-text").className = "invisible";
        
        document.getElementById("next-season-button").innerHTML = gameState.next_action;
        document.getElementById("next-season-button").onclick = doNextAction;
    }

    // If all tiles are barren, game over
    let barren_tiles = gameState.board.flat().filter((tile)=>tile.is_barren);
    if (barren_tiles.length === numrows*numcols){
        document.getElementById("next-season").className = "invisible";
        document.getElementById("player-action-text").className = "invisible";
        document.getElementById("action-specific-text").className = "invisible";
        document.getElementById("game-over").className = "visible";
    }
}

updateTileDisplay()