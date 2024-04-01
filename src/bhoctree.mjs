import * as three from '/node_modules/three/build/three.module.js';
import { Constants } from '/src/constants.mjs';

class Box {
  constructor(center, halfDimension) {
    this.center = center; // Center of the box
    this.halfDimension = halfDimension; // Half the width, height, and depth of the box
  }

  // Check if a point is inside the box
  contains(point) {
    const x = Math.abs(this.center.x - point.x) <= this.halfDimension.x;
    const y = Math.abs(this.center.y - point.y) <= this.halfDimension.y;
    const z = Math.abs(this.center.z - point.z) <= this.halfDimension.z;

    return x && y && z;
  }

  // Check if this box intersects with another box
  intersects(box) {
    const x = Math.abs(this.center.x - box.center.x) <= (this.halfDimension.x + box.halfDimension.x);
    const y = Math.abs(this.center.y - box.center.y) <= (this.halfDimension.y + box.halfDimension.y);
    const z = Math.abs(this.center.z - box.center.z) <= (this.halfDimension.z + box.halfDimension.z);

    return x && y && z;
  }
}

class OctreeNode {
  constructor(boundary, depth = 0) {
    this.boundary = boundary;
    this.depth = depth;
    this.children = [];
    this.body = null;
    this.mass = 0;
    this.centerOfMass = new three.Vector3();
  }

  insert(body, callback) {
    if (!this.boundary.contains(body.position)) {
      return false;
    }
  
    if (this.children.length === 0 && this.body === null) {
      this.body = body;
      this.mass = body.mass;
      this.centerOfMass.copy(body.position);
      if (callback) {
        callback(this);
      }
      return true;
    }
  
    if (this.children.length === 0) {
      this.subdivide();
    }
  
    for (let i = 0; i < 8; i++) {
      if (this.children[i].insert(body, callback)) {
        this.updateMassAndCenterOfMass(body);
        return true;
      }
    }
  
    return false;
  }

  subdivide() {
    const x = this.boundary.center.x;
    const y = this.boundary.center.y;
    const z = this.boundary.center.z;
    const d = this.boundary.halfDimension / 2;

    for (let i = 0; i < 8; i++) {
      const dx = ((i & 1) ? -1 : 1) * d;
      const dy = ((i & 2) ? -1 : 1) * d;
      const dz = ((i & 4) ? -1 : 1) * d;
      const center = new three.Vector3(x + dx, y + dy, z + dz);
      const boundary = new Box(center, d);
      this.children[i] = new OctreeNode(boundary, this.depth + 1);
    }

    this.children.forEach(child => child.insert(this.body));
    this.body = null;
  }

  updateMassAndCenterOfMass(body) {
    const totalMass = this.mass + body.mass;
    const alpha = body.mass / totalMass;
    this.centerOfMass.lerp(body.position, alpha);
    this.mass = totalMass;
  }

  calculateForce(body, force, theta) {
    if ((this.body === null) || (this.body === body) || (body === null)) {
      return;
    }

    if (this.children.length === 0) {
      const diff = this.body.position.clone().sub(body.position);
      const distance = diff.length();
      const direction = diff.normalize();
      const strength = G * this.mass * body.mass / (distance * distance);
      force.add(direction.multiplyScalar(strength));
    } else {
      const diff = this.centerOfMass.clone().sub(body.position);
      const distance = diff.length();
      const direction = diff.normalize();

      if (this.boundary.halfDimension / distance < theta) {
        const strength = G * this.mass * body.mass / (distance * distance);
        force.add(direction.multiplyScalar(strength));
      } else {
        for (let i = 0; i < 8; i++) {
          this.children[i].calculateForce(body, force, theta);
        }
      }
    }
  }
}

class Octree {
  constructor(boundary) {
    this.root = new OctreeNode(boundary);
  }

  insert(body) {
    this.root.insert(body);
  }

  remove(body) {
    this.root.remove(body);
  }

  calculateForce(body) {
    const force = new three.Vector3();
    this.root.calculateForce(body, force, Constants.theta);
    return force;
  }

  clear(){
    this.root = new OctreeNode(this.root.boundary);
  }

}

export {
  Box as Box, 
  OctreeNode as OctreeNode,
  Octree as Octree
}
