/*
   Copyright (c) 2012, Tomi Leppänen
   Copyright (c) 2012, Anssi "Miffyli" Kanervisto
   
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

var bonuses = new Array(); // Array to save bonuses
var BONUS_R = 15; // Radius of bonuses
var BONUS_R_POW2 = m.pow(BONUS_R,2); // Optimization

/* Creates bonus and adds it to gamearea */
/*
 * Valid types and their circle colours are (stroke,fill):
 *  - immortalize (green,green)
 *  - narrow (green,lighter green)
 *  - slowdown (green, darker blue)
 *  - speedup (green,red)
 *  - warp (green,white)
 *  - widen (green,lighter blue)
 *  - mirrorKeys (red, black)
 *  - narrowOthers (red,lighter green)
 *  - slowdownOthers (red,darker blue)
 *  - speedupOthers (red,red)
 *  - warpAll (blue,white)
 *  - widenOthers (red,lighher blue)
 *  - clear (blue,black)
 *  - immortalizeAll (blue,green)
 */
function bonus(type,x,y) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.remove = removeBonus;
    this.circle = document.createElementNS(NS,"circle");
    this.circle = elementSetAttributes(this.circle,{"cx":this.x, "cy":this.y, 
        "r":BONUS_R, "stroke-width":3, "id":"bonus_"+x+"_"+y});
    if (type == "immortalize") {
        this.circle = elementSetAttributes(this.circle, {"stroke":"green", 
            "fill":"00CC00"});
    } else if (type == "narrow") {
        this.circle = elementSetAttributes(this.circle, {"stroke":"green", 
            "fill":"00FF33"});
    } else if (type == "slowdown") {
        this.circle = elementSetAttributes(this.circle, {"stroke":"green", 
            "fill":"3300FF"});
    } else if (type == "speedup") {
        this.circle = elementSetAttributes(this.circle, {"stroke":"green", 
            "fill":"FF3300"});
    } else if (type == "warp") {
        this.circle = elementSetAttributes(this.circle, {"stroke":"green", 
            "fill":"FFFFFF"});
    } else if (type == "widen") {
        this.circle = elementSetAttributes(this.circle, {"stroke":"green", 
            "fill":"00CCFF"});
    } else if (type == "mirrorKeys") {
        this.circle = elementSetAttributes(this.circle, {"stroke":"blue", 
            "fill":"000000"});
    } else if (type == "narrowOthers") {
        this.circle = elementSetAttributes(this.circle, {"stroke":"green", 
            "fill":"00FF33"});
    } else if (type == "slowdownOthers") {
        this.circle = elementSetAttributes(this.circle, {"stroke":"red", 
            "fill":"3300FF"});
    } else if (type == "speedupOthers") {
        this.circle = elementSetAttributes(this.circle, {"stroke":"red", 
            "fill":"FF3300"});
    } else if (type == "warpAll") {
        this.circle = elementSetAttributes(this.circle, {"stroke":"blue", 
            "fill":"FFFFFF"});
    } else if (type == "widenOthers") {
        this.circle = elementSetAttributes(this.circle, {"stroke":"green", 
            "fill":"00CCFF"});
    } else if (type == "clear") {
        this.circle = elementSetAttributes(this.circle, {"stroke":"blue", 
            "fill":"000000"});
    } else if (type == "immortalizeAll") {
        this.circle = elementSetAttributes(this.circle, {"stroke":"blue", 
            "fill":"00CC00"});
    }
    gamearea.appendChild(this.circle);
}
/* Removes (used) bonus */
function removeBonus() {
    gamearea.removeChild(this.circle);
    bonuses.splice(bonuses.indexOf(this),1);
}

/* Adds bonus */
function addBonus() {
    var x = m.floor(m.random()*(game_width-100)+50);
    var y = m.floor(m.random()*(game_height-100)+50);
    var type = m.ceil(m.random()*14);
    switch(type) {
        case 1: type = "immortalize"; break;
        case 2: type = "narrow"; break;
        case 3: type = "slowdown"; break;
        case 4: type = "speedup"; break;
        case 5: type = "warp"; break;
        case 6: type = "widen"; break;
        case 7: type = "mirrorKeys"; break;
        case 8: type = "narrowOthers"; break;
        case 9: type = "slowdownOthers"; break;
        case 10: type = "speedupOthers"; break;
        case 11: type = "warpAll"; break;
        case 12: type = "widenOthers"; break;
        case 13: type = "clear"; break;
        case 14: type = "immortalizeAll"; break;
    }
    bonuses.push(new bonus(type,x,y));
}

function checkForBonus(x,y) {
    // Add code to check if player happened to hit a bonus
    for (var i in bonuses) {
        var distance = m.pow((x-bonuses[i].x),2)+m.pow((y-bonuses[i].y),2);
        if (distance < BONUS_R_POW2) return bonuses[i];
    } return false;
}
