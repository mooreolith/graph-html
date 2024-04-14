import { Util } from '/graph-html/src-copy/util.mjs'
import * as three from 'three'
import { Constants } from '/graph-html/src-copy/constants.mjs'
import { Octree } from '/graph-html/src-copy/bhoctree.mjs'
window.Constants = Constants

class LayoutVertex extends EventTarget {
  constructor(id, options, graph) {
    super()
    
    this.id = id
    this.options = Util.coalesce(Constants, options)
    this.graph = graph

    this.priority = Math.random() // dynamic matching things
    this.edges = new Set()

    const s = 5
    this.position = new three.Vector3(
      Math.random()*s, 
      Math.random()*s, 
      Math.random()*s
    )
    this.velocity = new three.Vector3(0, 0, 0)
    this.acceleration = new three.Vector3(0, 0, 0)
  }

  /*
   * Update the position of the vertex
   *
   * The update function is called on every frame of the animation loop.
   * It adds the vertex's acceleration to its velocity, and adds that to its position
   * 
   * This function should be called after repulsion and attraction have been calculated. 
   * 
   * last
   */
  update() {
    this.velocity.add(this.acceleration.clone().multiplyScalar(Constants.dt))
    this.velocity.multiplyScalar(Constants.D)
    this.position.add(this.velocity.clone().multiplyScalar(Constants.dt))
    this.acceleration.set(0, 0, 0)

    this.graph.dispatchEvent(new CustomEvent('layout-vertex-updated', { 
      detail: {
        id: this.id, 
        vertex: this, 
        pos: this.position
      },
      bubbles: true, 
      composed: true
    }))

    return this.position
  }
}

class LayoutEdge extends EventTarget {
  constructor(id, source, target, options, graph) {
    super()
    
    this.id = id
    this.source = source
    this.target = target
    this.graph = graph

    this.options = options // todo 
  }

  update() {
    // nothing special here
  }
}

class LayoutGraph extends EventTarget {
  static vertexId = 0
  static edgeId = 0

  vertices = new Map()
  edges = new Map()
  octree = new Octree()

  constructor(htmlGraph) {
    super()
    this.html = htmlGraph

    this.calculateRepulsionForces = this.calculateRepulsionForces.bind(this)
    this.calculateAttractionForces = this.calculateAttractionForces.bind(this)
  }

  addVertex(options) {
    /*
      * If a id is provided via the options object, it is assigned to the edge.
      * Otherwise, a unique id is generated for the edge.
      * It is not recommended to mix the two approaches. Pick one and stick with it. 
      */
    let id
    if(options.id){
      id = options.id
    }else{
      id = `vertex-${LayoutGraph.vertexId++}`
    }

    const vertex = new LayoutVertex(id, options, this)
    vertex.id = id

    this.octree.insert(vertex)
    this.vertices.set(id, vertex)
    return id
  }

  addEdge(sourceId, targetId, options) {
    /*
    * If a id is provided via the options object, it is assigned to the edge.
    * Otherwise, a unique id is generated for the edge.
    * It is not recommended to mix the two approaches. Pick one and stick with it. 
    */
    let id
    if(options.id){
      id = options.id
    }else{
      id = `edge-${LayoutGraph.edgeId++}`
    }

    const source = this.vertices.get(sourceId)
    const target = this.vertices.get(targetId)
    if(source && target){
      const edge = new LayoutEdge(id, source, target, options, this)
      edge.id = id
      this.edges.set(id, edge)

      source.edges.add(edge)
      target.edges.add(edge)

      return id
    }
  }

  removeVertex(id) {
    for(const [edgeId, edge] of this.edges){
      if(edge.sourceId === id || edge.targetId === id){
        this.removeEdge(edgeId)
      }
    }

    this.octree.remove(this.vertices.get(id))
    this.vertices.delete(id)
  }

  removeEdge(id) {
    const edge = this.edges.get(id)
    edge.source.edges.delete(edge)
    edge.target.edges.delete(edge)

    this.edges.delete(id)
  }

  /*
  * Update the position of all vertices in the graph
  * 
  * The update function is called on every frame of the animation loop.
  * It calculates the repulsion forces between all vertices and the 
  * attraction forces between connected vertices.
  */
  update() {
    // this.calculateRepulsionForces()
    this.estimateRepulsionForces()
    this.calculateAttractionForces()
    
    this.updateEdges()
    this.updateVertices()

    this.html.updateVertices()
    this.html.updateEdges()
  }

  calculateRepulsionForces() {
    const vertices = Array.from(this.vertices.values())

    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        if (vertices[i] && vertices[j] && (i !== j)) {
          const difference = new three.Vector3().subVectors(vertices[i].position, vertices[j].position)
          const distance = difference.length() || Constants.epsilon
          const force = difference.multiplyScalar(Constants.f0 / Math.pow(distance, 2))
          force.multiplyScalar(Constants.D)
          vertices[i].acceleration.add(force)
          vertices[j].acceleration.sub(force)
        }
      }
    }
  }

  calculateAttractionForces(){
    for(const edge of this.edges.values()){
      const difference = new three.Vector3().subVectors(edge.source.position, edge.target.position)
      const distance = difference.length() || Constants.epsilon
      const force = difference.multiplyScalar(Constants.K * (distance * distance)) 

      edge.source.acceleration.sub(force)
      edge.target.acceleration.add(force)
    }
  }

  estimateRepulsionForces(){
    const octree = new Octree()
    const vertices = Array.from(this.vertices.values())

    for(const vertex of vertices){
      octree.insert(vertex)
    }

    for(const vertex of vertices){
      const force = octree.estimate(vertex, (v1, v2) => {
        const difference = new three.Vector3().subVectors(v1.position, v2.position)
        const distance = difference.length() || Constants.epsilon
        return difference.multiplyScalar(Constants.f0 / Math.pow(distance, 2))
      })

      vertex.acceleration.add(force)
    }
  }

  /*
   * Update the position of all vertices in the graph
   */
  updateVertices(){
    this.vertices.forEach(vertex => vertex.update())
  } 

  /*
   * Trigger a redrawing of the updated positions of all edges in the graph
   */
  updateEdges(){
    this.edges.forEach(edge => this.dispatchEvent(new CustomEvent('layout-edge-updated', {
      detail: {
        id: edge.id,
        edge: edge,
        sourceId: edge.source.id,
        targetId: edge.target.id
      },
      bubbles: true,
      composed: true
    })))
  }
}

export {
  LayoutGraph as LayoutGraph
}
