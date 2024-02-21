# ribhuhooja.me
[ribhuhooja.me](https://ribhuhooja.me/)  
A basic website for the DALI developer challenge for S24. 
This is (an updated version of) my first website, ever!

## Guitar utils
An addition to the website, consistent with the "music" theme of the challenge.

Right now, the "trainer" util is active. It tells you to play a given note,
then if you played the correct note it adds to your score

(The functionality is really janky right now; it detects too much "noise". This can be improved by
adding a loudness filter, and waiting between asking for notes. But as a proof of concept it works)

The code to find notes is taken from [this](https://jonathan.bergknoff.com/journal/making-a-guitar-tuner-html5/)

## Save the Seasons

The game "save the seasons" from last time's developer challenge is included on the website.
The game is played on a grid of 8x8 tiles.  
To play the game, press the button at the bottom to step through to the next state. 
When called upon, click a tile to do an action. If the action was valid, it will step the game forward.

The game cycles through four seasons. In Fall, Winter and Spring, you can take actions to protect the trees and the world. In summer,
global warming sets fire to your trees and the desert (barren tiles) spread. A barren tile is effectively out of the game and cannot
be converted back; when all tiles are barren you lose the game. More instructions on how to play are on the website.
