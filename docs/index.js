function generateCube(n) {
  var graphHtml = document.getElementById('graph');

  function createEdge(sourceId, targetId) {
    var edge = document.createElement('edge-html');
    edge.setAttribute('sourceId', sourceId);
    edge.setAttribute('targetId', targetId);
    graphHtml.appendChild(edge)
  }

  let vertices = [];
  let edges = [];

  // Generate vertices
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      for (let z = 0; z < n; z++) {
        let vertex = document.createElement('vertex-html');
        vertex.id = `vertex-${x}-${y}-${z}`;
        graphHtml.appendChild(vertex);
      }
    }
  }

  // Generate edges
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      for (let z = 0; z < n; z++) {
        if (x < n - 1) {
          createEdge(`vertex-${x}-${y}-${z}`, `vertex-${x+1}-${y}-${z}`);
        }
        if (y < n - 1) {
          createEdge(`vertex-${x}-${y}-${z}`, `vertex-${x}-${y+1}-${z}`);
        }
        if (z < n - 1) {
          createEdge(`vertex-${x}-${y}-${z}`, `vertex-${x}-${y}-${z+1}`);
        }
      }
    }
  }

  return { vertices, edges };
}

function writeCubeCode(n){
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      for (let z = 0; z < n; z++) {
        console.log(`<vertex-html id="vertex-${x}-${y}-${z}"></vertex-html>`);
      }
    }
  }

  // Generate edges
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      for (let z = 0; z < n; z++) {
        if (x <= n - 1) {
          console.log(`<edge-html sourceId="vertex-${x}-${y}-${z}" targetId="vertex-${x+1}-${y}-${z}"></edge-html>`);
        }
        if (y <= n - 1) {
          console.log(`<edge-html sourceId="vertex-${x}-${y}-${z}" targetId="vertex-${x}-${y+1}-${z}"></edge-html>`);
        }
        if (z <= n - 1) {
          console.log(`<edge-html sourceId="vertex-${x}-${y}-${z}" targetId="vertex-${x}-${y}-${z+1}"></edge-html>`);
        }
      }
    }
  }
}
