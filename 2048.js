(function(d){
  "use strict";
  var GridSize = 100;
  var GridGap = 10;
  var UnitStep = GridSize + GridGap;
  var Max = 3;
  var Lock = true;
  
  var _slice = [].slice;
  var _sort = [].sort;
  var _transform = Modernizr.prefixed("transform");
  var exchange = {x: "y", y: "x"};
  
  var Control = {
    init: function(){
      d.getElementById("J-start").addEventListener("click", this.start, false);
      d.addEventListener("keyup", this.move, false);
    },
    start: function(e){
      Lock = false;
      if (Tile.collection.length > 0) {
        Tile.reset();
        Tile.init();
        return;
      }
      Tile.init();

    },
    move: function(e){
      if (Lock) return;
      switch(e.keyCode) {
        case 39: //right
          Tile.move(1, 0);
          break;
        case 38: //up
          Tile.move(0, -1);
          break;
        case 40: //down
          Tile.move(0, 1);
          break;
        case 37: //left
          Tile.move(-1, 0);
          break;
        default:
          break;
      }
    }
  };
    
  var Tile = {
    el: d.getElementById("J-tiles"),
    collection: [],
    init: function(){
      this.availables = [];
      for (var i = 0; i <= Max; i += 1) {
        for (var j = 0; j <= Max; j += 1) {
          this.availables.push([i, j].join(","));
        }
      }
      this.born(2);
    },
    reset: function(){
      for (var i = 0, len = this.collection.length; i < len; i += 1) {
        this.el.removeChild(this.collection[i]);
      }
      this.collection = [];
      ScoreBoard.reset();
    },
    //create a random tile
    //born(4, [1, 2])
    born: function(value){
      var tilePos;
      var availables = this.availables.slice(0);
      value = value || 2;
      
      this.collection.forEach(function(tile){
        tilePos = [tile.dataset.x, tile.dataset.y].join(",");
        if (availables.indexOf(tilePos) !== -1) {
          availables.splice(availables.indexOf(tilePos), 1);
        }
      });
           
      tilePos = availables[Math.round(Math.random() * (availables.length - 1))];
      tilePos = tilePos.split(",");
      
      var tile = d.createElement("div");
      tile.className = "tile";
      tile.innerText = value;
      tile.dataset.value = value;
      tile.dataset.x = tilePos[0];
      tile.dataset.y = tilePos[1];
      tile.style[_transform] = "translate(" + tilePos[0] * UnitStep + "px, " + tilePos[1] * UnitStep + "px) scale(.4)";
      this.collection.push(tile);
      this.el.appendChild(tile);
      
      Modernizr.prefixed('requestAnimationFrame', window)(function(){
        tile.style[_transform] = "translate(" + tilePos[0] * UnitStep + "px, " + tilePos[1] * UnitStep + "px) scale(1)";
      });
      
    },
    move: function(horizontal, vertical){
      Lock = true;
      var poses = [0, 1, 2, 3], groups = [], len, delt, updated = false;
      if (horizontal !== 0) {
        poses.forEach(function(pos){
          groups.push(this.getTileGroup("y", pos));
        }, this);
      } else if(vertical !== 0) {
        poses.forEach(function(pos){
          groups.push(this.getTileGroup("x", pos));
        }, this);
      } else {
        return;
      }
     groups.forEach(function(group, index){        
        if (horizontal + vertical > 0) {
          //正向
          len = group.length;
          while(group[len - 1]) {
            if (group[len - 2]) {
              //if two tile has the same value, join them
              if (group[len - 1].dataset.value === group[len - 2].dataset.value) {
                this.join(group[len - 2], group[len - 1]);
                group.splice(len - 2, 1);
                updated = true;
                len -= 2;
                continue;
              }
            }
            len -= 1;
          }
        } else {
          //逆向
          var i = 0;
          len = group.length;
          while(i < len) {
            if (group[i + 1]) {
              //if two tile has the same value, join them
              if (group[i].dataset.value === group[i + 1].dataset.value) {
                this.join(group[i + 1], group[i]);
                group.splice(i + 1, 1);
                updated = true;
                i += 2;
                continue;
              }
            }
            i += 1;
          }
        }
        delt = (horizontal + vertical) > 0 ? Max - (group.length - 1): 0;
        group.forEach(function(tile, index){
          if (horizontal && (+tile.dataset.x) !== (index + delt)) {
            tile.dataset.x = index + delt;
            updated = true;
          } else if (vertical && (+tile.dataset.y) !== (index + delt)) {
            tile.dataset.y = index + delt;
            updated = true;
          }
          tile.style[_transform] = "translate(" + tile.dataset.x * UnitStep + "px, " + tile.dataset.y * UnitStep + "px)";
        });
        
      }, this);
      
      if (this.collection.length === 16) {
        Game.end();
        return;
      }

      if (updated) {
        this.born(2);
      }
      Lock = false;
    },
    getTileGroup: function(prop, pos){
      var tiles = this.el.querySelectorAll(".tile[data-" + prop + "='" + pos + "']");
      tiles = _slice.call(tiles, 0);
      if (tiles.length > 0) {
        tiles.sort(function(t1, t2){
          return t1.dataset[exchange[prop]] - t2.dataset[exchange[prop]];
        });
      }
      return tiles;
    },
    // join two tiles to one tile with values doubled
    // tileA + tileB == > tileB
    join: function(tileA, tileB){
      tileA.style[_transform] = tileB.style[_transform];
      tileB.dataset.value *= 2;
      tileB.innerText = tileB.dataset.value;
      this.el.removeChild(tileA);
      this.collection.splice(this.collection.indexOf(tileA), 1);  
      ScoreBoard.update(tileB.dataset.value);   
    }
  };

  var ScoreBoard = {
    el: d.getElementById("J-score"),
    init: function(){
      this.score = 0;
      this.update(0);
    },
    update: function(score){
      this.score += +score;
      this.el.innerHTML = this.score;
    },
    reset: function(){
      this.score = 0;
      this.update(0);
    }
  };

  var Game = {
    init: function(){
      Control.init();
      ScoreBoard.init();
      console.clear();
    },
    end: function(){
      Lock = true;
      alert("You failed");
    }
  };
  
  Game.init();
  
  
}(document));