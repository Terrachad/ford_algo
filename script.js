const numNodes = 6;
const numEdges = 8;
let nodes = [];
let links = [];
let departureNode = 'A';

// Generate random nodes
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

    // Corrected comparison to use nodes.length instead of Object.keys(nodes).length
    return Object.keys(visited).length === nodes.length;
}


// Function to generate a random link with negative weights
function generateRandomLink(existingLinks) {
    let sourceIndex = Math.floor(Math.random() * numNodes);
    let targetIndex = Math.floor(Math.random() * numNodes);

    while (targetIndex === sourceIndex || linkExists(existingLinks, nodes[sourceIndex].id, nodes[targetIndex].id)) {
        sourceIndex = Math.floor(Math.random() * numNodes);
        targetIndex = Math.floor(Math.random() * numNodes);
    }

    const weight = Math.floor(Math.random() * 21) - 10; // Random weight between -10 and 10
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
while (links.length < numEdges) {
    const newLink = generateRandomLink(links);
    links.push(newLink);
}

// Ensure connectivity
while (!isConnected(nodes, links)) {
    const newLink = generateRandomLink(links);
    links.push(newLink);
}


function updateGraph(numNodes, numEdges) {
    if (numNodes !== null) {
        // Update the number of nodes
        numNodes = Math.max(1, numNodes); // Ensure numNodes is at least 1
        // Generate new nodes
        nodes.length = 0; // Clear existing nodes
        for (let i = 0; i < numNodes; i++) {
            nodes.push({ id: String.fromCharCode(65 + i) }); // Generate node IDs as A, B, C, ...
        }
    }

    if (numEdges !== null) {
        // Update the number of edges
        numEdges = Math.max(1, numEdges); // Ensure numEdges is at least 1
        // Generate new links
        links.length = 0; // Clear existing links
        // Generate random links
        while (links.length < numEdges) {
            const newLink = generateRandomLink(links);
            links.push(newLink);
        }
        // Ensure connectivity
        while (!isConnected(nodes, links)) {
            const newLink = generateRandomLink(links);
            links.push(newLink);
        }
    }

    // Update the graph visualization
    updateVisualization();

    // Restart the simulation after updating the nodes and links
    simulation.nodes(nodes);
    simulation.force('link').links(links);
    simulation.alpha(0.3).restart();
}


function updateVisualization() {

    // Restart the simulation
    // Update the simulation with the new nodes and links
    simulation.nodes(nodes);
    simulation.force('link').links(links);

    // Restart the simulation
    simulation.alpha(0.3).restart();

    // Update links
    link = link.data(links);
    link.enter().insert('path', '.node') // Insert links before nodes
        .attr('class', 'link')
        .style('stroke', '#999')
        .style('stroke-opacity', 0.6)
        .style('fill', 'none')
        .style('stroke-width', 2)
        .attr('marker-end', function(d) {
            return linkExists(links, d.target, d.source) ? null : 'url(#arrow)';
        })
        .merge(link);
    link.exit().remove();

    // Append nodes to the SVG container
    node = svg.selectAll('.node')
        .data(nodes)
        .enter().append('circle')
        .attr('class', 'node')
        .attr('r', 20)
        .style('fill', '#77d')
        .style('stroke', '#fff')
        .style('stroke-width', '2px')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    // Update nodes
    // Append nodes
    node = node.enter().append('circle')
        .attr('class', 'node')
        .attr('r', 20)
        .style('fill', '#77d')
        .style('stroke', '#fff')
        .style('stroke-width', '2px')
        .style('z-index', '1') // Ensure nodes are displayed on top
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended))
    node.exit().remove();

    // Update link text
    linkText = linkText.data(links);
    link = link.enter().insert('path', '.node') // Insert links before nodes
        .attr('class', 'link')
        .style('stroke', '#999')
        .style('stroke-opacity', 0.6)
        .style('fill', 'none')
        .style('stroke-width', 2)
        .style('z-index', '0') // Lower z-index to keep links below nodes
        .attr('marker-end', function(d) {
            return linkExists(links, d.target, d.source) ? null : 'url(#arrow)';
        })
        .merge(link);
    linkText.exit().remove();

    // Update label positions
    label = label.data(nodes);
    label.enter().append('text')
        .text(d => d.id)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .merge(label);
    label.exit().remove();
}


// Event listener for the visualize button
document.getElementById('visualizeButton').addEventListener('click', function() {
    const { distances, predecessor } = bellmanFord(nodes, links, departureNode);
    visualizeStep(departureNode, distances, predecessor);
    populateConnectionsTable(links); // Populate connections table
});

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

const minDistance = 150; // Adjust as needed

const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(250))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(svgWidth / 2, svgHeight / 2))
    .force('x', d3.forceX(svgWidth / 2).strength(0.03)) // Constrain nodes horizontally
    .force('y', d3.forceY(svgHeight / 2).strength(0.03)) // Constrain nodes vertically
    .force('collision', d3.forceCollide(minDistance)); // Repulsive force to prevent overlap

// Append SVG elements
// Update links
link = svg.selectAll('.link')
    .data(links)
    .join('path')
    .attr('class', 'link')
    .style('stroke', '#ccc')
    .style('stroke-opacity', 0.6)
    .style('fill', 'none')
    .style('stroke-width', 2)
    .attr('marker-end', function(d) {
        return linkExists(links, d.target, d.source) ? null : 'url(#arrow)';
    });

// Add arrowhead
svg.append('defs').append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 30)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5');


// Update link text
linkText = svg.selectAll('.link-text')
    .data(links)
    .join('text')
    .attr('class', 'link-text')
    .attr('dy', -5)
    .style('text-anchor', 'middle')
    .style('fill', '#333')
    .text(d => d.weight);

// Update nodes
node = svg.selectAll('.node')
    .data(nodes, d => d.id)
    .join('circle')
    .attr('class', 'node')
    .attr('r', 25)
    .style('fill', '#007bff')
    .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

// Add text to nodes
label = svg.selectAll('.label')
    .data(nodes, d => d.id)
    .join('text')
    .attr('class', 'label')
    .text(d => d.id)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle');


// Function to check if a link is bidirectional
function isBidirectional(link) {
    return links.some(otherLink => otherLink.source === link.target && otherLink.target === link.source);
}


// Tick function to update positions
simulation.on('tick', () => {
    link.attr('d', function(d) {
            // Invert the condition: Draw curves for bidirectional links and straight lines for unidirectional links
            if (!linkExists(links, d.target, d.source)) { // Check if the link is unidirectional
                // Draw a straight line for unidirectional links
                return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
            } else {
                // Draw a curved line for bidirectional links
                const dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy) * 2; // Control the curve radius, adjust if necessary
                return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
            }
        })
        .attr('marker-end', function(d) {
            // Add arrow marker for unidirectional links
            return d.source.id !== d.target.id ? 'url(#arrow)' : null;
        });



    // Update link weight circles
    linkWeightCircle.attr('cx', function(d) {
            if (!linkExists(links, d.target, d.source)) { // For unidirectional links
                return (d.source.x + d.target.x) / 2; // Place the circle in the middle of the line
            } else { // For bidirectional links
                const midX = (d.source.x + d.target.x) / 2; // Calculate the midpoint of the link along the x-axis
                const offsetX = (d.target.y - d.source.y) * 15 / Math.sqrt(Math.pow(d.target.x - d.source.x, 2) + Math.pow(d.target.y - d.source.y, 2)); // Adjust the divisor (10) as needed
                return midX + offsetX; // Offset the midpoint by the calculated amount
            }
        })
        .attr('cy', function(d) {
            if (!linkExists(links, d.target, d.source)) { // For unidirectional links
                return (d.source.y + d.target.y) / 2; // Place the circle in the middle of the line
            } else { // For bidirectional links
                const midY = (d.source.y + d.target.y) / 2; // Calculate the midpoint of the link along the y-axis
                const offsetY = (d.source.x - d.target.x) * 15 / Math.sqrt(Math.pow(d.target.x - d.source.x, 2) + Math.pow(d.target.y - d.source.y, 2)); // Adjust the divisor (10) as needed
                return midY + offsetY; // Offset the midpoint by the calculated amount
            }
        });

    // Update the text inside link weight circles
    linkWeightCircleText = svg.selectAll('.link-weight-circle-text')
        .data(links)
        .join('text')
        .attr('class', 'link-weight-circle-text')
        .attr('x', function(d) {
            if (!linkExists(links, d.target, d.source)) { // For unidirectional links
                return (d.source.x + d.target.x) / 2; // Place the text in the middle of the line
            } else { // For bidirectional links
                const midX = (d.source.x + d.target.x) / 2; // Calculate the midpoint of the link along the x-axis
                const offsetX = (d.target.y - d.source.y) * 0.1; // Adjust the offset manually
                return midX + offsetX; // Offset the midpoint by the calculated amount
            }
        })
        .attr('y', function(d) {
            if (!linkExists(links, d.target, d.source)) { // For unidirectional links
                return (d.source.y + d.target.y) / 2; // Place the text in the middle of the line
            } else { // For bidirectional links
                const midY = (d.source.y + d.target.y) / 2; // Calculate the midpoint of the link along the y-axis
                const offsetY = (d.source.x - d.target.x) * 0.1; // Adjust the offset manually
                return midY + offsetY; // Offset the midpoint by the calculated amount
            }
        })
        .text(d => d.weight);


    // Update the rest as it is
    node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

    label
        .attr('x', d => d.x)
        .attr('y', d => d.y);
});


// Add circles for link weights
const linkWeightCircle = svg.selectAll('.link-weight-circle')
    .data(links)
    .join('circle')
    .attr('class', 'link-weight-circle')
    .attr('r', 5) // Adjust the radius of the circle
    .style('fill', '#77d'); // Set the fill color of the circle


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

node.on('click', function(event, d) {
    // Update departureNode to the selected node's ID
    departureNode = d.id;
    document.getElementById('sourceNode').textContent = `Nodo di partenza: ${departureNode}`;

    // Reset all nodes to their default color
    svg.selectAll('.node').style('fill', '#77d'); // Assuming '#77d' is your default node color

    // Set the selected node's color to green
    d3.select(this).style('fill', 'green');
})

// Event listener for the visualize button
document.getElementById('visualizeButton').addEventListener('click', function() {
    const { distances, predecessor } = bellmanFord(nodes, links, departureNode);
    visualizeStep(departureNode, distances, predecessor);
});