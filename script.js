function typeSlowly(text) {
    var length = text.length;
    var i = -1;
    function increment(){
        if (i <= length){
            i++;
            return text.slice(0, i);
        }
        return text;
    }
    return increment;
}

function slowlyFillText(element, text, delay){
    let increment = typeSlowly(text);
    let intervalID = setInterval(() => {
        element.innerHTML = increment();
    }, delay/text.length);
    
    setTimeout(() => clearInterval(intervalID), (delay/text.length)*(text.length + 1));
}

function slowlyFillElement(element, delayBeforeStart, delay){
    let text = element.innerHTML;
    element.innerHTML = "";
    setTimeout(() => slowlyFillText(element, text, delay), delayBeforeStart);
}

slowlyFillElement(document.getElementById("title-header"), 0, 1500);
document.getElementsByTagName("p").array.forEach(element => {
    slowlyFillElement(element, index*100, 1500);
});
