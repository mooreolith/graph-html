import { LayoutGraph } from '/graph-html/src-copy/layout.mjs'
import * as three from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/*
  customElements for representing the graph in the DOM
*/

class GraphHTML extends HTMLElement {
  static vertexId = 0
  static edgeId = 0
  static graphId = 0

  vertices = new Map()
  edges = new Map()

  constructor() {
    super()
    this.layout = new LayoutGraph(this)

    if (this.getAttribute('id')) {
      this.id = this.getAttribute('id')
    } else {
      this.id = `graph-${GraphHTML.graphId++}`
    }
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          border: var(--graph-border, 1px solid black);
          width: var(--graph-width, 100vw);
          height: var(--graph-height, 100vh);
        }

        canvas {
          width: 100%;
          height: 100%;
        }
      </style>
      <canvas></canvas>
    `
    this.setupScene()
    this.setupOrbitControls()
    this.setupEventHandlers()
  }

  connectedCallback() {
    this.initializeInlineVertices()
    this.initializeInlineEdges()
    this.render()
  }

  setupScene() {
    this.scene = new three.Scene()

    const canvas = this.shadowRoot.querySelector('canvas')
    canvas.width = this.offsetWidth
    canvas.height = this.offsetHeight
    const renderer = new three.WebGLRenderer({ canvas })
    this.renderer = renderer

    const camera = new three.PerspectiveCamera(75, this.offsetWidth / this.offsetHeight, 0.1, 1000)
    camera.position.z = 15
    camera.lookAt(0, 0, 0)
    this.scene.add(camera)
    this.camera = camera

    const light = new three.AmbientLight(0xffffff, 1)
    this.scene.add(light)
    this.light = light
  }

  setupOrbitControls(){
    const controls = new OrbitControls(this.camera, this.renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.25
    controls.enableZoom = true
    controls.update()

    this.controls = controls
  }

  setupEventHandlers() {
    this.addEventListener('html-vertex-ready', this.onHTMLVertexReady.bind(this))
    this.addEventListener('html-edge-ready', this.onHTMLEdgeReady.bind(this))
    this.addEventListener('html-vertex-removed', this.onHTMLVertexRemoved.bind(this))
    this.addEventListener('html-edge-removed', this.onHTMLEdgeRemoved.bind(this))
    this.layout.addEventListener('layout-vertex-updated', this.onLayoutVertexUpdated.bind(this))
    this.layout.addEventListener('layout-edge-updated', this.onLayoutEdgeUpdated.bind(this))
  }

  initializeInlineVertices() {
    this.querySelectorAll('vertex-html').forEach((vertex) => {
      // this.addVertex(vertex)
      this.dispatchEvent(new CustomEvent('html-vertex-ready', {
        detail: {
          id: vertex.id,
          vertex: vertex
        },
        bubbles: true,
        composed: true
      }))
    })
  }

  initializeInlineEdges() {
    this.querySelectorAll('edge-html').forEach((edge) => {
      this.dispatchEvent(new CustomEvent('html-edge-ready', {
        detail: {
          id: edge.id,
          edge: edge,
          sourceId: edge.getAttribute('sourceId'),
          targetId: edge.getAttribute('targetId'),
          edge: edge
        },
        bubbles: true,
        composed: true
      }))
    })
  }

  disconnectedCallback() {
    this.renderer.dispose()
    this.vertices.clear()
    this.edges.clear()

    this.removeEventListener('html-vertex-ready')
    this.removeEventListener('html-edge-ready')
    this.removeEventListener('html-vertex-removed')
    this.removeEventListener('html-edge-removed')

    this.layout.removeEventListener('layout-vertex-updated')
    this.layout.removeEventListener('layout-edge-updated')
  }

  createVertex(options = {}) {
    let id
    if (options.id) {
      id = options.id
    } else {
      id = `vertex-${GraphHTML.vertexId++}`
    }

    const vertex = document.createElement('vertex-html')
    vertex.setAttribute("id", id)

    this.addVertex(vertex)
    return vertex.id
  }

  addVertex(vertex) {
    this.layout.addVertex(vertex.id)
    vertex.graph = this 
    this.appendChild(vertex)
  }

  createEdge(sourceId, targetId, options = {}) {
    let id
    if (options.id) {
      id = options.id
    } else {
      id = `edge-${GraphHTML.edgeId++}`
    }

    const edge = document.createElement('edge-html')
    edge.setAttribute('id', id)
    edge.source = this.layout.vertices.get(sourceId)
    edge.target = this.layout.vertices.get(targetId)
    edge.setAttribute('sourceId', sourceId)
    edge.setAttribute('targetId', targetId)

    this.addEdge(edge)
    return edge.id
  }

  addEdge(edge) {
    this.layout.addEdge(edge.sourceId, edge.targetId, edge.id)
    edge.graph = this
    this.appendChild(edge)
  }

  removeVertex(id) {
    this.layout.removeVertex(id)
    const vertex = this.querySelector(`vertex-html[id="${id}"]`)
    if (vertex) {
      vertex.remove()
    }
  }

  removeEdge(id) {
    this.layout.removeEdge(id)
    const edge = this.querySelector(`edge-html[id="${id}"]`)
    if (edge) {
      edge.remove()
    }
  }

  onHTMLVertexReady(e) {
    const geometry = new three.BoxGeometry(.25, .25, .25)
    const material = new three.MeshLambertMaterial({ color: 0x44aa88 })
    const cube = new three.Mesh(geometry, material)

    cube.position.set(
      Math.random() * 100 - 50,
      Math.random() * 100 - 50,
      Math.random() * 100 - 50
    )

    const id = e.detail.id
    this.vertices.set(id, cube)
    this.layout.addVertex({"id": id})
    cube.position.copy(
      this.layout.vertices.get(id).position)

    this.scene.add(cube)
  }

  onHTMLEdgeReady(e) {
    const edge = e.detail.edge
    const sourceId = edge.sourceId
    const targetId = edge.targetId
    
    const source = this.layout.vertices.get(sourceId)
    const target = this.layout.vertices.get(targetId)

    if(source && target){
      edge.source = source
      edge.target = target

      // drawLine
      const geometry = new three.BufferGeometry().setFromPoints([source.position, target.position])
      const material = new three.LineBasicMaterial({ color: 0x44aa88 })
      const line = new three.Line(geometry, material)
      this.scene.add(line)    
      
      const id = e.detail.id
      this.edges.set(id, line)
      this.layout.addEdge(sourceId, targetId, { id: id })
    }


  }

  onHTMLVertexRemoved(e) {
    const id = e.detail.id

    const vertex = this.vertices.get(id)
    this.scene.remove(vertex)
    this.querySelector(`vertex-html[id="${id}"]`).remove()

    this.layout.removeVertex(id)
    this.vertices.delete(id)
  }

  onHTMLEdgeRemoved(e) {
    const id = e.detail.id

    const edge = this.edges.get(id)
    this.scene.remove(edge)
    this.querySelector(`edge-html[id="${id}"]`).remove()

    this.layout.removeEdge(id)
    this.edges.delete(e.detail.id)
  }

  updateCube(e){
    const id = e.detail.id
    if(this.vertices.has(id) && this.layout.vertices.has(id)){
      const layoutVertex = this.layout.vertices.get(id)
      this.vertices.get(id).position.copy(layoutVertex.position)
    }
  }

  updateLine(e) {
    const id = e.detail.id
    if(this.edges.has(id) && this.layout.edges.has(id)){
      const id = e.detail.id
      const layoutEdge = this.layout.edges.get(id)
      const positionAttribute = this.edges.get(id).geometry.getAttribute('position')
    
      const sx = layoutEdge.source.position.x
      const sy = layoutEdge.source.position.y
      const sz = layoutEdge.source.position.z
      positionAttribute.setXYZ(0, sx, sy, sz)

      const tx = layoutEdge.target.position.x
      const ty = layoutEdge.target.position.y
      const tz = layoutEdge.target.position.z
      positionAttribute.setXYZ(1, tx, ty, tz)

      positionAttribute.needsUpdate = true
    }
  }

  updateVertices(){
    for(const [id, vertex] of this.vertices){
      const layoutVertex = this.layout.vertices.get(id)
      vertex.position.copy(layoutVertex.position)
    }
  }

  updateEdges(){
    for(const [id, edge] of this.edges){
      const layoutSource = this.layout.vertices.get(edge.sourceId)
      const layoutTarget = this.layout.vertices.get(edge.targetId)

      if(layoutSource && layoutTarget){
        const positionAttribute = edge.geometry.getAttribute('position')
        positionAttribute.setXYZ(0, layoutSource.position.x, layoutSource.position.y, layoutSource.position.z)
        positionAttribute.setXYZ(1, layoutTarget.position.x, layoutTarget.position.y, layoutTarget.position.z)
        positionAttribute.needsUpdate = true
      }
    }
  }

  onLayoutVertexUpdated(e) {
    this.updateCube({detail: {id: e.detail.id}})
  }

  onLayoutEdgeUpdated(e) {
    this.updateLine({detail: {id: e.detail.id}})
  }

  render() {
    requestAnimationFrame(this.render.bind(this))
    
    this.layout.update()
    this.updateVertices()
    this.updateEdges()

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }
}

class VertexHTML extends HTMLElement {
  constructor() {
    super()
    
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.innerHTML = `
      <style>
        :host{
          display: none;
          color: var(--vertex-color, cornflowerblue);
        }
      </style>
    `
  }

  connectedCallback() {
    this.id = this.getAttribute('id')
    this.dispatchEvent(new CustomEvent('html-vertex-ready', {
      detail: { id: this.id, vertex: this },
      bubbles: true,
      composed: true
    }))
  }

  disconnectedCallback() {
    this.dispatchEvent(new CustomEvent('html-vertex-removed', {
      detail: { id: this.id },
      bubbles: true,
      composed: true
    }))
  }
}

class EdgeHTML extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.innerHTML = `
      <style>
        :host{
          display: none;
          color: var(--edge-color, cornflowerblue);
        }
      </style>
    `
  }

  connectedCallback() {
    this.id = this.getAttribute('id') || `edge-${GraphHTML.edgeId++}`
    this.sourceId = this.getAttribute('sourceId')
    this.targetId = this.getAttribute('targetId')

    this.color = this.style.getPropertyValue('--edge-color')
    this.dispatchEvent(new CustomEvent('html-edge-ready', {
      detail: {
        id: this.id,
        sourceId: this.sourceId,
        targetId: this.targetId,
        edge: this
      },
      bubbles: true,
      composed: true
    }))
  }

  disconnectedCallback() {
    this.dispatchEvent(new CustomEvent('html-edge-removed', {
      detail: { id: this.id, edge: this},
      bubbles: true,
      composed: true
    }))

  }
}

customElements.define('vertex-html', VertexHTML)
customElements.define('edge-html', EdgeHTML)
customElements.define('graph-html', GraphHTML)
