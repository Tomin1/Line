/**
   Copyright (c) 2012, Tomi Leppänen aka Tomin
   Copyright (c) 2012, Anssi "Miffyli" Kanervisto
        members of group 'The Codebomb'
   
   Line!
   Achtung, die Kurve! clone written in javascript and svg
   
   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 2 of the License, or
   (at your option) any later version.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
   MA 02110-1301, USA.
*/

/**
 * Original source code is available in git:
 * git://github.com/The-Codebomb/Line.git
 * Use this command to download it (requires git):
 * git clone git://github.com/The-Codebomb/Line.git
 * 
 * Achtung, die Kurve! is a game of G. Burg Internet Solutions and
 * This Game called 'Line!' has nothing to do with them, but is a 
 * independently developed title that has many similarities with 
 * the Original Game. If you have something to complain or praise 
 * about This Game, write about it to code@codebomb.dy.fi .
 * 
 * Code contributions are welcome, when they are made with care and
 * passion. Git commit messages should be well written. Forks are 
 * allowed of course.
 * 
 * Check LICENSE file in this directory for more information about 
 * licensing.
 * 
 * This Game is allowed distribute in minified form when this and 
 * above comment are included in readable form. Also GPL license 
 * of version 2 or later is recommended to be provided as a separate 
 * file. Remember that non-minified source code has to be always 
 * provided as GPL requires. 
 * 
 * You may want to check out http://codebomb.dy.fi/
 */

/* Constants */
m = Math;
var PLAYERS = 6; // Maximium amount of players
var COLORS = ["#0000CD","#008000","#FF0000","#FF00FF", // Colors
    "#556B2F","#000000"];
var NAMES = ["Goa'uld","Dalek","Sylar","Pinkie", // Names 
    "Boba Fett","Darth Vader"];
var DEFAULT_KEYS_LEFT = [37,65,74,97,82]; // Default left keys
var DEFAULT_KEYS_RIGHT = [39,68,76,99,89]; // Default right keys

var TURNINGSPEED = 0.1;
var MOVINGSPEED = 5;

var TIME_BETWEEN_BREAKS = 75;
var BREAKLENGTH = 10;

var MAX_TIME_BETWEEN_BONUSES = 800;
var MAX_BONUSES = 5;
var BONUS_TIME = 200; // How many loops bonuses affect
var POINTS_WIDTH = 400; // Space to display points

var LOOPSPEED = 30; // Microseconds between loops

var fontSize = 50;
var font = "Courier New, monospace";

var FULLCIRCLE = 2*Math.PI;
var NS = "http://www.w3.org/2000/svg"; // SVG namespace

/* Global variables */
var border; // SVGrect element
var breaksOn = true; // Is breaking used or not
var commonBonuses = new Array();
var game; // SVG element
var gamearea; // SVG element
var game_width; // Width of the gamearea
var game_height; // Game height
var menuarea; // SVG element
var next_bonus_in = Math.floor(Math.random()*MAX_TIME_BETWEEN_BONUSES);
var players = new Array(); // Array for line-objects
var points_to_end;
var pointsarea; // SVG element
var timeout;
var wallMode = "deadly"; // Valid values are "deadly" and "warp"

/* Initializing function */
function init() {
    game = document.getElementById("game"); // Setting up variables ->
    gamearea = document.getElementById("gamearea");
    menuarea = document.getElementById("menu");
    pointsarea = document.getElementById("points");
    border = document.createElementNS(NS,"rect"); 
    // Setting up correct height =>
    if (document.body.getBoundingClientRect().height > window.innerHeight ||
            document.body.getBoundingClientRect().width > window.innerWidth) {
        window.addEventListener("resize",fixGameSize,true);
        fixGameSize();
    }
    game_width = game.viewBox.baseVal.width-POINTS_WIDTH;
    game_height = game.viewBox.baseVal.height;
    border = elementSetAttributes(border,{"id":"border", 
        "width":game_width, "height":game_height, "fill":"none", 
        "stroke":"black", "stroke-width":"5"});
    game.appendChild(border);
    for (var i = 0; i < PLAYERS; i++) { // Create players ->
        players.push(new line(NAMES[i],COLORS[i],DEFAULT_KEYS_LEFT[i],
        DEFAULT_KEYS_RIGHT[i]));
    }
	menu(); // Display menus
}

/* Begins the game */
function startGame() {
    removeSpaceHandler();
    clearArea(menuarea);
    clearArea(gamearea);
    bonuses = new Array();
    mainMenuOn = false;
    for (var i in players) { // Setting up players ->
        players[i] = new line(players[i].name,players[i].colour,
            players[i].keyL,players[i].keyR);
        if (i >= playerAmount) { // Lines that aren't used
            players[i].playing = false;
        }
    }
    points_to_end = 10*(playerAmount-1); // Calculate points
    if (playerAmount == 1) { // Set up bots for single player game ->
        for (var i in players) {
            if (!players[i].playing) {
                players[i].playing=true;
                players[i].bot=true;
            }
        }
        points_to_end = 10*(players.length-1);
    }
    startNewRound(); // Begin the first round
}

/* Begins new round */
function startNewRound() {
    removeSpaceHandler();
    clearArea(menuarea);
    clearArea(gamearea);
    bonuses = new Array();
    for (var i in players) { // Setting up players ->
        if (players[i].playing) players[i].init();
    }
    wallMode = "deadly";
    newPointsDisplay();
    createText(game_width/2,game_height/3,"Press space to continue!");
    var call = function() {
        removeSpaceHandler();
        clearArea(menuarea);
        timeout = setTimeout("main()",LOOPSPEED); // Start "loop"
        addInputKeyHandlers(); // Activate input system
    }
    addSpaceHandler(call);
}

/* Main "loop" */
/*
 * This function handles running the game motor:
 *  - Handles common bonuses (external) 
 *  - Checks wall mode and sets walls according to that
 *  - Runs player's inputLoop (or bot's botControl) (external)
 *  - Calculates new line ending
 *  - Checks if player hit something (external)
 *  - Warps if needed
 *  - Checks if player hit bonus and handles it (external)
 *  - Handles bonuses that player already has (external)
 *  - Breaks or continues line
 *  - Draws some new line
 *  - Adds new bonuses (partially external)
 *  - Redraws points display (external)
 *  - Checks if game is over (external)
 *  - Sets timeout for next iteration
 */
function main(bots) {
    var time = (new Date()).getTime(); // To count time of one loop
    handleCommonBonuses();
    if (wallMode == "deadly") // Set the borders if wallMode has changed
        border.setAttributeNS(null,"stroke-dasharray","none");
    else if (wallMode == "warp") 
        border.setAttributeNS(null,"stroke-dasharray","8,8")
    for (var i in players) {
        if (players[i].playing && players[i].alive) {
            var warped = false;
            if (players[i].bot) botControl(players[i]); // Control bots
            else inputLoop(players[i]); // Control players
            var sameDirection = false; // Assume that player's direction changed
            if (players[i].direction == players[i].oldDirection) 
                sameDirection = true;
            var old_x = players[i].x;
            var x = m.round(players[i].x + players[i].speed*m.sin(
                players[i].direction));
            var old_y = players[i].y;
            var y = m.round(players[i].y + players[i].speed*m.cos(
                players[i].direction));
            if (checkForCollision(x,y,players[i])) { // Collision handling ->
                players[i].alive = false;
                spillBlood(x,y);
                for (var k in players) { // Give points to other players ->
                    if (players[k].playing && players[k].alive) 
                        players[k].points++;
                }
            }
            if ((wallMode == "warp" || players[i].warp) && // Warping ->
                    (x <= 0 || x >= game_width ||
                     y <= 0 || y >= game_height)) {
                if (!players[i].break) players[i].addPoint(x,y,sameDirection);
                if (x <= 0) { x = game_width; }
                else if (x >= game_width) { x = 0; }
                else if (y <= 0) { y = game_height; }
                else if (y >= game_height) { y = 0; }
                players[i].splitLine();
                players[i].oldDirection="";
                warped = true;
            } // Bonus system =>
            var bonus = checkForBonus(x,y); // Check if player hit a bonus ->
            if (bonus)  // When a new bonus is used
                handleNewBonus(bonus,players[i]);
            handlePlayersBonuses(players[i]); // Old bonuses
            if (breaksOn) { // Breaking ->
                if (!players[i].break && players[i].breakcounter <= 0) {
                    players[i].addPoint(x,y,sameDirection);
                    players[i].oldDirection="";
                    players[i].break = true;
                    players[i].breakcounter=BREAKLENGTH;
                } else if (players[i].break && players[i].breakcounter <= 0) {
                    players[i].splitLine();
                    players[i].addPoint(x,y,false);
                    players[i].break = false;
                    players[i].breakcounter=TIME_BETWEEN_BREAKS+m.floor(
                        m.random()*TIME_BETWEEN_BREAKS);
                } else if (!players[i].break) { 
                    players[i].addPoint(x,y,sameDirection);
                    if (warped == false) players[i].oldDirection = 
                        players[i].direction;
                } else {
                    players[i].moveCircle(x,y);
                }
                players[i].breakcounter--;
            } else { // Normally drawing ->
                players[i].addPoint(x,y,sameDirection);
                if (warped == false) players[i].oldDirection = 
                    players[i].direction;
            }
        }
    }
    if (next_bonus_in <= 0) {
        if (bonuses.length < MAX_BONUSES) addBonus();
        next_bonus_in = m.floor(m.random()*MAX_TIME_BETWEEN_BONUSES);
    } else next_bonus_in--;
    updatePoints(); // Updates points display
    if (isRoundOver()) { // When the round is over ->
        var winner;
        if (winner = isGameOver()) { // If the game is over ->
            if (bots) botGameOver();
            else gameOver(winner);
        } else {
            if (bots) botRoundOver();
            else roundOver();
        }
        return;
    }
    time = (new Date()).getTime()-time; // Looping ->
    looptime = LOOPSPEED - time;
    if (looptime < 0) {
        looptime = 0; 
        //console.log("Warning: too slow system");
    } 
    if (bots && timeout && mainMenuOn) timeout = setTimeout("main(true)",
        looptime);
    else if (timeout) timeout = setTimeout("main()",looptime);
}

/* Check for a collision */
function checkForCollision(dx,dy,player) {
    /*
     * Collision between lines is detected checking if there 
     * are intersections of a circle and tested polyline. 
     * To do that we must first do some tests to ensure 
     * that it's even possible for tested segment to intersect 
     * with the circle. Then were are checking if the line of 
     * tested segment intersects. This testing is highly 
     * mathematical.
     * 
     * The circle's center is players current position (dx,dy) 
     * and radius is sum of player's polyline's radius and 
     * tested polyline's radius. To get the segments to test 
     * we must get all the lines on gamearea, then split 
     * their points and now we get two points for each line.
     * Segment means here the part of a line between two points.
     * 
     * More about the used method:
     * http://local.wasp.uwa.edu.au/~pbourke/geometry/sphereline/
     * Thanks to people who have written this algorithm.
     * 
     * The calculations and checks are last lines of this part
     * and all boring stuff is before them. 'The boring stuff' 
     * means all string manipulations and such things that are 
     * needed getting line segments' cordinates.
     */
    if (!player.break)  { 
        var polylines = gamearea.getElementsByTagName("polyline");
        for (var i = 0; i < polylines.length; i++) {
            var points = polylines[i].getAttributeNS(null,"points");
            points = points.split(" ");
            if (polylines[i] == player.polyline) { // Working around the 
                if (points.length > 20) { // player's own segments + optimizing 
                    points = points.splice(0,points.length-20);
                } else continue;
            }
            var r = player.d/2+polylines[i].getAttributeNS(
                null,"stroke-width")/2; // Radius
            for (var j = 0; j < points.length-1; j++) {
                var xy = points[j].split(",");
                var ex = xy[0];
                var ey = xy[1];
                xy = points[j+1].split(",");
                var fx = xy[0];
                var fy = xy[1];
                // Optimizing (some lines don't need to be calculated at all) =>
                if (((dx > ex+r && dx > fx+r) || (dx < ex-r && dx < fx-r)) &&
                        ((dy > ey+r && dy > fy+r) || (dy < ey-r && dy < fy-r)))
                    continue;
                // Calculations =>
                var res = ((dx-ex)*(fx-ex) + (dy-ey)*(fy-ey)) / 
                    ((fx-ex)*(fx-ex) + (fy-ey)*(fy-ey));
                if (res < 0 || res > 1) continue;
                var a = (fx-ex)*(fx-ex) + (fy-ey)*(fy-ey);
                var b = 2*((fx-ex)*(ex-dx) + (fy-ey)*(ey-dy)); 
                var c = dx*dx + dy*dy + ex*ex + ey*ey - 2*(dx*ex+dy*ey)-(r*r);
                if ((b*b-4*a*c) >= 0)
                    return true; 
            }
        } // Check if player hit a wall =>
    } if (wallMode == "deadly" && !player.warp) {
        if (dx <= player.d/2 || dx >= game_width-player.d/2 
                || dy <= player.d/2 || dy >= game_height-player.d/2)
            return true;
    } return false;
}

/* Check if the round is over */
/*
 * Game ends if only one player is alive
 */
function isRoundOver() {
    skippedOne = false
    for (var i = 0; i < players.length; i++) {
        if (players[i].playing && players[i].alive) {
            if (!skippedOne) skippedOne = true;
            else return false;
        }
    } return true;
}

/* Ends round */
/*
 * Called when round ends
 */
function roundOver() {
    removeInputKeyHandlers();
    createText(game_width/2,game_height/3,"Press space to begin new round!");
    addSpaceHandler(startNewRound);
}

/* Check if the game is over */
/*
 * Game ends if some one has needed points for points_to_end
 * Returns winning player when game is over, otherwise returns false
 */
function isGameOver() {
    for (var i in players) {
        if (players[i].points >= points_to_end) return players[i];
    } return false;
}

/* Ends game */
/* 
 * Called when a game ends
 * Does some cleaning up and informing user (Game Over text)
 * Takes winner as parameter
 */
function gameOver(winner) {
    removeInputKeyHandlers();
    timeout = clearTimeout(timeout);
    createText(game_width/2,game_height/4,"Game Over!","red");
    if (winner) 
        createText(game_width/2,game_height/5,"The winner is "+winner.name,
            winner.colour);
	retryMenu();
}

/* Adds attributes to an element */
function elementSetAttributes(element,values) {
    for (var name in values) {
        element.setAttributeNS(null,name,values[name]);
    }
    return element;
}

/* Fixes game height for some (stupid) browsers */
/*
 * At least Opera and Firefox need this
 * Used in init and body.onresize
 */
function fixGameSize() {
    game.setAttributeNS(null,"height",m.floor(window.innerHeight*0.95));
    game.setAttributeNS(null,"width",m.floor(window.innerWidth*0.95));
}

/* Continues the game */
function continueGame() {
    removeSpaceHandler();
    clearArea(menuarea);
    timeout = setTimeout("main()",LOOPSPEED); // Start "loop"
    addInputKeyHandlers(); // Activate input system
}

/* Removes all elements from specified SVGElement */
function clearArea(area) {
    while(area.lastChild) {
        area.removeChild(area.lastChild);
    }
}
