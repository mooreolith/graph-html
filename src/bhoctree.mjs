import * as three from 'three'
import { Constants } from '/src/constants.mjs';

class Octree {
  constructor(){
    this.inners = new Set();
    this.outers = new Map();
    this.centerSum = new three.Vector3();
    this.count = 0;
  }

  center(){
    if(this.count == 0){
      return new three.Vector3();
    }

    this.centerSum = Array.from(this.inners).reduce((prev, cur) => {
      return prev.add(cur.position);
    }, new three.Vector3());

    return this.centerSum.divideScalar(this.count-1);
  }

  get position(){
    return this.center();
  }

  insert(vertex){
    this.count++;

    if(this.inners.size == 0){
      this.placeInner(vertex);
    }else{
      var dist = this.center().clone().sub(vertex.position);

      if(dist.length() < Constants.innerDistance){
        this.placeInner(vertex);
      }else{
        this.placeOuter(vertex);
      }
    }
  }

  estimate(v, forceFn){
    var f = new three.Vector3();
    if(this.inners.has(v)){
      for(var inner of this.inners){
        if(inner.id != v.id){
          var force = forceFn(v, inner);
          f.add(force);
        }
      }
    }else{
      var c = this.center();
      f.add(forceFn(v, this)).multiplyScalar(this.inners.size);
    }

    this.outers.forEach((octree, key) => {
      var dist = c.clone().sub(octree.center());
      var d = dist.length();

      if(d < Constants.theta * this.size()){
        f.add(octree.estimate(v, forceFn));
      }else{
        var force = forceFn(v, octree);
        f.add(force);
      }
    });

    return f;
  }

  size(){
    return this.count;
  }

  getOctant(pos){
    var c = this.center();

    var x = c.x < pos.x ? 'l' : 'r';
    var y = c.y < pos.y ? 'u' : 'd';
    var z = c.z < pos.z ? 'i' : 'o';

    return `${x}${y}${z}`;
  }

  placeInner(vertex){
    this.inners.add(vertex);
  }

  placeOuter(vertex){
    var o = this.getOctant(vertex.position);
    if(!this.outers.has(o)){
      this.outers.set(o, new Octree());
    }

    this.outers.get(o).insert(vertex);
  }
}

export {
  Octree as Octree
}