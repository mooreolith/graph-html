function generateCube(n, begin=0) {
  var graphHtml = document.getElementById('graph');

  // Generate vertices
  let count = 0;
  for (let x = 0 + begin; x < n + begin; x++) {
    for (let y = 0 + begin; y < n + begin; y++) {
      for (let z = 0 + begin; z < n + begin; z++) {
        graphHtml.createVertex({id: `vertex-${x}-${y}-${z}`});
      }
    }
  }

  // Generate edges
  for (let x = 0 + begin; x < n + begin; x++) {
    for (let y = 0 + begin; y < n + begin; y++) {
      for (let z = 0 + begin; z < n + begin; z++) {
        if (x < n + begin - 1) {
          graphHtml.createEdge(`vertex-${x}-${y}-${z}`, `vertex-${x+1}-${y}-${z}`);
        }
        if (y < n + begin - 1) {
          graphHtml.createEdge(`vertex-${x}-${y}-${z}`, `vertex-${x}-${y+1}-${z}`);
        }
        if (z < n + begin - 1) {
          graphHtml.createEdge(`vertex-${x}-${y}-${z}`, `vertex-${x}-${y}-${z+1}`);
        }
      }
    }
  }

  const current = begin + count;

  return current;
}
