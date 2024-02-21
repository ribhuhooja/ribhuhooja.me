// This entire script was written under extreme time pressure
// and is thus a mess of global variables
// All I can say is that IT WORKS

var prevNote;
var chosenNote;
const numberNotes = 12;

var score = 0;
var mistakes = 0;

var changeNote = (note) => {

    if (prevNote == note){
        return;
    }

    prevNote = note;

    if (note == chosenNote){
        chooseNote();
        incrementScore(1);
    } else {
        incrementMistakes(1);
    }
}

var chooseNote = () => {
    let noteIndex = Math.floor(Math.random()*numberNotes);   
    chosenNote = notes[noteIndex];
    document.getElementById("chosen-note").innerHTML = chosenNote;
}

// These two could easily be the same function
// but this was the quickest way to get it done
var incrementScore = (inc) => {
    score += inc;
    document.getElementById("score").innerHTML = "Score: " + score;
}

var incrementMistakes = (inc) => {
    mistakes += inc;
    document.getElementById("mistakes").innerHTML = "Mistakes: " + mistakes;
}

console.log("here");

chooseNote();