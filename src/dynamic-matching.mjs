class PriorityQueue {
  constructor(){
    this.queue = [];
  }

  push(node){
    this.queue.push(node);
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  pop(){
    return this.queue.shift();
  }

  isEmpty(){
    return this.queue.length === 0;
  }
}

class DynamicMatching {
  constructor(finerGraph, levels){
    this.finerGraph = finerGraph;
    this.matching = new Map(); // id -> bool

    this.priorityQueue = new PriorityQueue();
    this.finerGraph.coarserGraph = this;

    if(levels > 0){
      this.coarserGraph = new DynamicMatching(this, levels - 1);
      this.coarserGraph.finerGraph = this;
    }

    this.vertices = new Map();
    this.edges = new Map();
  }

  addEdge(edge){
    if(!edge.priority) edge.priority = Math.random();

    const count = this.edges.get([edge.sourceId, edge.targetId].toString()) || 0;
    this.edges.set([edge.sourceId, edge.targetId].toString(), ++count);

    this.priorityQueue.push(edge);
  }

  deleteEdge(edge){
    if(this.matching.has(edge.id)) this.unmatch(edge);
    let count = this.edges.get([edge.sourceId, edge.targetId].toString());
    count--

    if(count === 0){
      this.edges.delete([edge.sourceId, edge.targetId].toString());
    }

    if(edge.source.edges.size === 0) this.vertices.delete(edge.sourceId);
    if(edge.target.edges.size === 0) this.vertices.delete(edge.targetId);

    this.edges.forEach(edge => {
      if(edge.sourceId === edge.sourceId || edge.targetId === edge.targetId){
        this.priorityQueue.push(edge);
      }
    })
  }

  deleteVertex(vertex){
    vertex.edges.forEach(edge => this.deleteEdge(edge))
  }

  addvertex(vertex){
    this.vertices.set(vertex.id, vertex);
  }

  match(edge){
    // "For each edge e' where e --> e', if e' is matched, then unmatch(e')"
    this.edges.forEach(e => {
      if(e.sourceId === edge.sourceId || e.targetId === edge.targetId){
        if(this.matching.has(e.id)) this.unmatch(e);
      }
    })

    // "Delete vertices v1' and v2' from the coarser graph"'
    this.coarserGraph.deleteVertex(edge.source);
    this.coarserGraph.deleteVertex(edge.target);

    // "Create a new vertex v1 u v2 in G'
    const vertex = new LayoutVertex(`${edge.sourceId}-${edge.targetId}`, {}, this.coarserGraph);

    // "For all edges e = (v, v') in G incident on v1 or v2 (but not both), add a corresponding
    // edge to or from v1 u v2 in G'."
    this.edges.forEach(e => {
      if(e.sourceId === edge.sourceId || e.targetId === edge.targetId){
        this.coarserGraph.addEdge(e);
      }
    })

    // "For each e' such that e --> e', add e' to the queue."
    this.edges.forEach(e => {
      if(e.sourceId === edge.sourceId || e.targetId === edge.targetId){
        this.priorityQueue.push(e);
      }
    })
  }

  unmatch(edge){
    // "... where e = (v1, v2). Delete any edges in G' incident on v1 u v2."
    this.coarserGraph.deleteVertex(edge.source);
    this.coarserGraph.deleteVertex(edge.target);

    // "Delete the vertex v1 u v2 from G'."
    this.coarserGraph.deleteVertex(edge.source);

    // "Add new vertices v1' and v2' to G'."
    this.coarserGraph.addVertex(edge.source);
    this.coarserGraph.addVertex(edge.target);

    // "For each edge incident on v1 or v2 in G, add a corresponding edge to G'."
    this.edges.forEach(e => {
      if(e.sourceId === edge.sourceId || e.targetId === edge.targetId){
        this.coarserGraph.addEdge(e);
      }
    })

    // "For each edge e' such taht e --> e', add e' to the queue."
    this.edges.forEach(e => {
      if(e.sourceId === edge.sourceId || e.targetId === edge.targetId){
        this.priorityQueue.push(e);
      }
    })
  }
}

export {
  DynamicMatching as DynamicMatching
}