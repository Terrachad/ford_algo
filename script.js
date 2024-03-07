const numNodes = 7;
const numEdges = 8;

// Generate random nodes
const nodes = [];
for (let i = 0; i < numNodes; i++) {
    nodes.push({ id: String.fromCharCode(65 + i) }); // Generate node IDs as A, B, C, ...
}

// Function to check if all nodes are connected
function isConnected(nodes, links) {
    const adjacencyList = {};
    for (const link of links) {
        if (!adjacencyList[link.source]) adjacencyList[link.source] = [];
        if (!adjacencyList[link.target]) adjacencyList[link.target] = [];
        adjacencyList[link.source].push(link.target);
        adjacencyList[link.target].push(link.source);
    }

    const visited = {};
    const stack = [Object.keys(adjacencyList)[0]];
    while (stack.length > 0) {
        const node = stack.pop();
        if (!visited[node]) {
            visited[node] = true;
            for (const neighbor of adjacencyList[node]) {
                stack.push(neighbor);
            }
        }
    }

    return Object.keys(visited).length === Object.keys(nodes).length;
}

// Function to generate a random link
function generateRandomLink(existingLinks) {
    let sourceIndex = Math.floor(Math.random() * numNodes);
    let targetIndex = Math.floor(Math.random() * numNodes);

    while (targetIndex === sourceIndex || linkExists(existingLinks, nodes[sourceIndex].id, nodes[targetIndex].id)) {
        sourceIndex = Math.floor(Math.random() * numNodes);
        targetIndex = Math.floor(Math.random() * numNodes);
    }

    const weight = Math.floor(Math.random() * 10) + 1; // Random weight between 1 and 10
    return {
        source: nodes[sourceIndex].id,
        target: nodes[targetIndex].id,
        weight: weight
    };
}

// Function to check if a link already exists
function linkExists(links, source, target) {
    return links.some(link => (link.source === source && link.target === target) || (link.source === target && link.target === source));
}

// Generate random links
const links = [];
while (links.length < numEdges) {
    const newLink = generateRandomLink(links);
    links.push(newLink);
}

// Ensure connectivity
while (!isConnected(nodes, links)) {
    const newLink = generateRandomLink(links);
    links.push(newLink);
}

               function bellmanFord(nodes, links, source) {
                const distances = {};
                const predecessor = {};
                
                // Initialize distances and predecessors
                nodes.forEach(node => {
                  distances[node.id] = Infinity;
                  predecessor[node.id] = null;
                });
                distances[source] = 0; // Correct initialization for the source node
              
                // Relax edges repeatedly
for (let i = 0; i < nodes.length - 1; i++) {
    console.log(`Iteration ${i + 1}`);
    links.forEach(link => {
        const u = link.source.id; // Accessing the 'id' property of the source node
        const v = link.target.id; // Accessing the 'id' property of the target node
        const weight = link.weight;
        console.log(`Processing edge (${u}, ${v}) with weight ${weight}`);
        if (distances[u] + weight < distances[v]) {
            distances[v] = distances[u] + weight;
            predecessor[v] = u;
            console.log(`Updated distance to ${v} to ${distances[v]}`);
        }
    });
}
              
                // Check for negative cycles
                links.forEach(link => {
                  const u = link.source;
                  const v = link.target;
                  const weight = link.weight;
                  if (distances[u] + weight < distances[v]) {
                    console.log('Graph contains negative cycle');
                  }
                });
              
                return { distances, predecessor };
              }
              



// Function to visualize Bellman-Ford step
function visualizeStep(sourceNode, distances, predecessor) {
  // Remove existing text elements
  d3.selectAll('.distance-text').remove();
  d3.selectAll('.predecessor-text').remove();

  // Add text for distances
  Object.keys(distances).forEach(node => {
    d3.select('#dataPanel').append('p')
      .attr('class', 'distance-text')
      .text(`Distance to ${node}: ${distances[node] === Infinity ? 'Infinity' : distances[node]}`);
  });

  // Add text for predecessors
  Object.keys(predecessor).forEach(node => {
    d3.select('#dataPanel').append('p')
      .attr('class', 'predecessor-text')
      .text(`Predecessor of ${node}: ${predecessor[node] === null ? 'None' : predecessor[node]}`);
  });
}

// Event listener for the visualize button

// Create D3 force simulation
const svgWidth = 800;
const svgHeight = 600;
const svg = d3.select('#graphSvg')
  .attr('width', svgWidth)
  .attr('height', svgHeight);

const simulation = d3.forceSimulation(nodes)
  .force('link', d3.forceLink(links).id(d => d.id).distance(100))
  .force('charge', d3.forceManyBody().strength(-200))
  .force('center', d3.forceCenter(svgWidth / 2, svgHeight / 2));

// Append SVG elements
const link = svg.selectAll('.link')
  .data(links)
  .enter().append('line')
  .attr('class', 'link')
  .style('stroke', '#999')
  .style('stroke-opacity', 0.6)
  .style('stroke-width', d => Math.sqrt(d.weight))
  .attr('marker-end', 'url(#arrow)');

// Add arrowhead
svg.append('defs').append('marker')
  .attr('id', 'arrow')
  .attr('viewBox', '0 -5 10 10')
  .attr('refX', 15)
  .attr('refY', 0)
  .attr('markerWidth', 6)
  .attr('markerHeight', 6)
  .attr('orient', 'auto')
  .append('path')
  .attr('d', 'M0,-5L10,0L0,5');

// Add text for weights
const linkText = svg.selectAll('.link-text')
  .data(links)
  .enter().append('text')
  .attr('class', 'link-text')
  .attr('dy', -5)
  .style('text-anchor', 'middle')
  .style('fill', '#333')
  .text(d => d.weight);

const node = svg.selectAll('.node')
  .data(nodes)
  .enter().append('circle')
  .attr('class', 'node')
  .attr('r', 20)
  .style('fill', '#77d')
  .call(d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended));

// Add text to nodes
const label = svg.selectAll(null)
  .data(nodes)
  .enter()
  .append('text')
  .text(d => d.id)
  .attr('dy', '0.35em')
  .attr('text-anchor', 'middle');

// Tick function to update positions
simulation.on('tick', () => {
  link
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y);

  linkText
    .attr('x', d => (d.source.x + d.target.x) / 2)
    .attr('y', d => (d.source.y + d.target.y) / 2);

  node
    .attr('cx', d => d.x)
    .attr('cy', d => d.y);

  label
    .attr('x', d => d.x)
    .attr('y', d => d.y);
});

function dragstarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragended(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}


let departureNode = 'A';

// Event listener for nodes to update the departure node
node.on('click', function(event, d) {
    departureNode = d.id;
    document.getElementById('sourceNode').textContent = `Departure Node: ${departureNode}`;
});

// Event listener for the visualize button
document.getElementById('visualizeButton').addEventListener('click', function() {
    const { distances, predecessor } = bellmanFord(nodes, links, departureNode);
    visualizeStep(departureNode, distances, predecessor);
    populateConnectionsTable(links); // Populate connections table
});

