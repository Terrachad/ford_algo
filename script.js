const numNodes = 7;
const numEdges = 10;

// Generate random nodes
const nodes = [];
for (let i = 0; i < numNodes; i++) {
    nodes.push({ id: String.fromCharCode(65 + i) }); // Generate node IDs as A, B, C, ...
}

// Function to check if all nodes are connected
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

    // Corrected comparison to use nodes.length instead of Object.keys(nodes).length
    return Object.keys(visited).length === nodes.length;
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
    return links.some(link => (link.source === source && link.target === target));
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
            .text(`Distanza a ${node}: ${distances[node] === Infinity ? '∞' : distances[node]}`);
    });

    // Add text for predecessors
    Object.keys(predecessor).forEach(node => {
        d3.select('#dataPanel').append('p')
            .attr('class', 'predecessor-text')
            .text(`Predecessore di ${node}: ${predecessor[node] === null ? 'Nessun' : predecessor[node]}`);
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
    .force('link', d3.forceLink(links).id(d => d.id).distance(200)) // Increase distance to 150
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(svgWidth / 2, svgHeight / 2));

// Append SVG elements
const link = svg.selectAll('.link')
    .data(links)
    .enter().append('path')
    .attr('class', 'link')
    .style('stroke', '#999')
    .style('stroke-opacity', 0.6)
    .style('fill', 'none') // Important for paths to be drawn as lines
    .style('stroke-width', 2)
    .attr('marker-end', function(d) {
        return linkExists(links, d.target, d.source) ? null : 'url(#arrow)';
    }); // Apply arrowhead to the end of the lines only if the link is bidirectional

// Add arrowhead
svg.append('defs').append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 25)
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
// Event listener for double click to add a node
svg.on('dblclick', function(event) {
    const [x, y] = d3.pointer(event);
    const newNodeId = String.fromCharCode(65 + nodes.length); // Generate new node ID
    const newNode = { id: newNodeId, x, y }; // Include x and y coordinates of the mouse pointer
    nodes.push(newNode);

    // Update the simulation with the new node
    node = node.data(nodes, d => d.id);
    node.enter().append('circle')
        .attr('class', 'node')
        .attr('r', 20)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .style('fill', '#77d')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    // Add text to the new node
    label = label.data(nodes, d => d.id);
    label.enter().append('text')
        .text(d => d.id)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('x', d => d.x)
        .attr('y', d => d.y);

    // Restart the simulation
    simulation.nodes(nodes);
    simulation.alpha(0.3).restart();
});

// Event listener for right click to remove a node
node.on('contextmenu', function(event, d) {
    d3.event.preventDefault(); // Prevent default right-click behavior
    const index = nodes.findIndex(node => node.id === d.id); // Find the index of the clicked node
    nodes.splice(index, 1); // Remove the node from the array

    // Update the simulation and visualization
    node = node.data(nodes, d => d.id);
    node.exit().remove();
    label = label.data(nodes, d => d.id);
    label.exit().remove();

    // Restart the simulation
    simulation.nodes(nodes);
    simulation.alpha(0.3).restart();
});

// Tick function to update positions
// Update the 'tick' function to adjust text positions as well
simulation.on('tick', () => {
    link.attr('d', function(d) {
        if (linkExists(links, d.target, d.source)) { // Check if the link is bidirectional
            return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
        } else {
            const dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy) * 2; // Control the curve radius
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        }
    });

    // Position linkText at the middle of the arc path
    linkText.attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2 - (d.curve ? d.curve / 2 : 0))
        .text(d => d.weight);

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

node.on('click', function(event, d) {
    // Update departureNode to the selected node's ID
    departureNode = d.id;
    document.getElementById('sourceNode').textContent = `Departure Node: ${departureNode}`;

    // Reset all nodes to their default color
    svg.selectAll('.node').style('fill', '#77d'); // Assuming '#77d' is your default node color

    // Set the selected node's color to green
    d3.select(this).style('fill', 'green');
})

// Event listener for the visualize button
document.getElementById('visualizeButton').addEventListener('click', function() {
    const { distances, predecessor } = bellmanFord(nodes, links, departureNode);
    visualizeStep(departureNode, distances, predecessor);
    populateConnectionsTable(links); // Populate connections table
});