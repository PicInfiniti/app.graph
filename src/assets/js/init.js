import $ from "jquery";
import * as d3 from 'd3';
import Graph from 'graphology'; // Import Graphology
import { getMinAvailableNumber, getAvailableLabel, removeString } from './utils';
import { keyDown } from '../../main';
import { LimitedArray, getTouchPosition } from './utils';
import { getComponent } from "./utils";

// Initialize data structures
export const selectedNode = [];
export const selectedEdge = [];
export let pressTimer = null;
export const History = new LimitedArray(50);
export const common = {
  lastTapTime: 0,
  hover: false,
  dragComponent: false,
  vertexLabel: true,
  node_radius: 10,
  edge_size: 2,
  label_size: 15,
  x: 0,
  y: 0
}

// Create SVG container
export const svg = d3.select("#chart")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%")
  .attr("preserveAspectRatio", "xMinYMin meet");

History.push(new Graph())
const edgeGroup = svg.append("g").attr("class", "edges");
const nodeGroup = svg.append("g").attr("class", "nodes");



svg.on("dblclick touchend", handleDoubleClick);

// Handle double click or double tap to add a node
function handleDoubleClick(event) {
  const currentTime = Date.now();
  if (event.type === "dblclick" || (event.type === "touchend" && currentTime - common.lastTapTime < 300)) {
    if (!common.hover) {
      addNodeAtEvent(event);
    }
  }
  common.lastTapTime = currentTime;
}

// Function to add a new node at event position
function addNodeAtEvent(event) {
  event.preventDefault();
  const color = $("#color").val();
  let [x, y] = event.type === "touchend" ? getTouchPosition(event, svg) : d3.pointer(event);

  const newID = getMinAvailableNumber(History.graph.nodes());
  const newLabel = getAvailableLabel(newID);

  updateHistory(History, "add");
  History.graph.addNode(newID, { x, y, color, label: newLabel });
  updateGraph(History.graph);
}

// Dragging behavior
const dragNode = d3.drag()
  .on("start", (event, d) => {
    // Store the initial pointer position
    common.x = event.x;
    common.y = event.y;

    updateHistory(History, "update");
  })
  .on("drag", (event, d) => {
    // Calculate the distance moved from the initial pointer position
    const distanceX = event.x - common.x;
    const distanceY = event.y - common.y;

    if (common.dragComponent) {
      for (let node of getComponent(History.graph, d.id)) {
        History.graph.updateNodeAttributes(node, attrs => ({
          ...attrs,
          x: attrs.x + distanceX,
          y: attrs.y + distanceY
        }));
      }
    } else {
      History.graph.updateNodeAttributes(d.id, attrs => ({
        ...attrs,
        x: attrs.x + distanceX,
        y: attrs.y + distanceY
      }));
    }

    common.x = event.x;
    common.y = event.y;

    updateGraph(History.graph);
  })


// Dragging behavior
const dragEdge = d3.drag()
  .on("start", (event, d) => {
    // Store the initial pointer position
    common.x = event.x;
    common.y = event.y;

    updateHistory(History, "update");
  })
  .on("drag", (event, d) => {
    // Calculate the distance moved from the initial pointer position
    const distanceX = event.x - common.x;
    const distanceY = event.y - common.y;

    if (common.dragComponent) {
      for (let node of getComponent(History.graph, History.graph.source(d))) {
        History.graph.updateNodeAttributes(node, attrs => ({
          ...attrs,
          x: attrs.x + distanceX,
          y: attrs.y + distanceY
        }));
      }
    } else {
      // Update node position using the original node coordinates
      History.graph.updateNodeAttributes(History.graph.source(d), attrs => ({
        ...attrs,
        x: attrs.x + distanceX,
        y: attrs.y + distanceY
      }));
      History.graph.updateNodeAttributes(History.graph.target(d), attrs => ({
        ...attrs,
        x: attrs.x + distanceX,
        y: attrs.y + distanceY
      }));

    }

    // Update the stored pointer position for continuous tracking
    common.x = event.x;
    common.y = event.y;

    updateGraph(History.graph);
  })

export function updateGraph(graph) {
  const nodes = graph.nodes().map(id => ({ id, ...graph.getNodeAttributes(id) }));
  const edges = graph.edges();

  // Update edges
  const edgesSelection = edgeGroup.selectAll("line").data(edges);
  edgesSelection.exit().remove();

  edgesSelection.enter()
    .append("line")
    .merge(edgesSelection)
    .attr("x1", d => graph.getNodeAttribute(graph.source(d), 'x'))
    .attr("y1", d => graph.getNodeAttribute(graph.source(d), 'y'))
    .attr("x2", d => graph.getNodeAttribute(graph.target(d), 'x'))
    .attr("y2", d => graph.getNodeAttribute(graph.target(d), 'y'))
    .attr("stroke", d => {
      if (selectedEdge.includes(d)) return "orange"
      return graph.getEdgeAttribute(d, 'color')
    })
    .attr("stroke-width", common.edge_size)
    .on("click touchend", function (event, d) {
      if (event.ctrlKey || event.type === "touchend") {
        selectElement("edge", d);
      }
    })
    .on("dblclick", function (event, d) {
      selectElement("edge", d);
      console.log("select edge")
    })
    .on("mouseover", function () {
      d3.select(this).attr("stroke", "orange");
      clearTimeout(pressTimer); // Cancel selection if user moves or lifts finger
      common.hover = true;
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", d => {
        if (selectedEdge.includes(d)) return "orange"
        else return graph.getEdgeAttribute(d, 'color')
      });
      clearTimeout(pressTimer); // Cancel selection if user moves or lifts finger
      common.hover = false;
    })
    .call(dragEdge)

  // Update nodes
  const nodesSelection = nodeGroup.selectAll("circle").data(nodes, d => d.id);
  nodesSelection.exit().remove();
  nodesSelection.enter()
    .append("circle")
    .merge(nodesSelection)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", common.node_radius)
    .attr("fill", d => {
      if (common.vertexLabel) {
        return "white"
      } else {
        return d.color
      }
    })
    .attr("stroke", d => {
      if (selectedNode.includes(d.id)) return "orange"
      return d.color
    })
    .attr("stroke-width", 3)
    .on("click touchend", function (event, d) {
      if (event.ctrlKey || event.type === "touchend") {
        if (common.dragComponent) {
          for (let node of getComponent(History.graph, d.id)) {
            selectElement("node", node);
          }
        } else {
          selectElement("node", d.id);
        }
        console.log("select node")
      }
    })
    .on("dblclick", function (event, d) {
      if (common.dragComponent) {
        for (let node of getComponent(History.graph, d.id)) {
          selectElement("node", node);
        }
      } else {
        selectElement("node", d.id);
      }
      console.log("select node")
    })
    .on("mouseover", function () {
      d3.select(this).attr("stroke", "orange");
      clearTimeout(pressTimer); // Cancel selection if user moves or lifts finger
      common.hover = true

    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", d => {
        if (selectedNode.includes(d.id)) return "orange"
        else return d.color
      });
      clearTimeout(pressTimer); // Cancel selection if user moves or lifts finger
      common.hover = false;
    })
    .call(dragNode); // Apply drag behavior

  // Update labels

  if (common.vertexLabel) {
    const labelsSelection = nodeGroup.selectAll("text").data(nodes, d => d.id);
    labelsSelection.exit().remove();
    labelsSelection.enter()
      .append("text")
      .merge(labelsSelection)
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(d => d.label)
      .attr("font-size", `${common.label_size}px`)
      .attr("fill", "black");
  } else {
    nodeGroup.selectAll("text").remove();
  }
}

function selectElement(element = "node", d) {
  if (element == "node") {
    if (selectedNode.includes(d)) {
      removeString(selectedNode, d)
    } else {
      selectedNode.push(d)
    }
  }
  if (element == "edge") {
    if (selectedEdge.includes(d)) {
      removeString(selectedEdge, d)
    } else {
      selectedEdge.push(d)
    }
  }
  updateGraph(History.graph); // Re-draw graph
}

export function updateHistory(History, status = 'update') {
  switch (status) {
    case "redo":
      if (History.index < History.data.length - 1) {
        History.updateIndex(History.index + 1);
        console.log("redo")
      } else {
        console.log("nothing to redo")
      };
      break;
    case "undo":
      if (History.index > 0) {
        History.updateIndex(History.index - 1);
        console.log("undo")
      } else {
        console.log("nothing to undo")
      };
      break;

    default:
      console.log("update")
      const graphClone = History.graph.copy();
      History.data.length = History.index + 1
      History.push(graphClone);
      break;
  }

  updateGraph(History.graph);

}

// Selection Box
let selectionBox = svg.append("rect")
  .attr("fill", "rgba(0, 0, 200, 0.2)") // Semi-transparent blue
  .attr("stroke", "blue")
  .attr("stroke-dasharray", "4")
  .style("display", "none");

let startX, startY;

// Mouse Down - Start Selection
svg.on("mousedown", function (event) {
  if (event.target.tagName !== "svg") return; // Only start if clicking on empty space

  const [x, y] = d3.pointer(event);
  startX = x;
  startY = y;

  selectionBox
    .attr("x", x)
    .attr("y", y)
    .attr("width", 0)
    .attr("height", 0)
    .style("display", "block");

  svg.on("mousemove", function (event) {
    const [newX, newY] = d3.pointer(event);

    selectionBox
      .attr("x", Math.min(startX, newX))
      .attr("y", Math.min(startY, newY))
      .attr("width", Math.abs(newX - startX))
      .attr("height", Math.abs(newY - startY));
  });

  svg.on("mouseup", function () {
    const x = parseFloat(selectionBox.attr("x")),
      y = parseFloat(selectionBox.attr("y")),
      w = parseFloat(selectionBox.attr("width")),
      h = parseFloat(selectionBox.attr("height"));


    // Select nodes inside the box
    selectedNode.length = 0;
    selectedEdge.length = 0;

    nodeGroup.selectAll("circle").each(function (d) {
      if (d.x >= x && d.x <= x + w && d.y >= y && d.y <= y + h) {
        selectElement("node", d.id); // Store selected node ID
      }
    });

    edgeGroup.selectAll("line").each(function (d) {
      const sx = History.graph.getNodeAttribute(History.graph.source(d), 'x');
      const sy = History.graph.getNodeAttribute(History.graph.source(d), 'y');
      const tx = History.graph.getNodeAttribute(History.graph.target(d), 'x');
      const ty = History.graph.getNodeAttribute(History.graph.target(d), 'y');

      const rect = { x: x, y: y, width: w, height: h };
      const line = [{ x: sx, y: sy }, { x: tx, y: ty }];

      if (lineIntersectsRect(line, rect)) {
        selectElement("edge", d); // Store selected edge
      }
    });

    updateGraph(History.graph); // Re-draw the graph with selection changes
    selectionBox.style("display", "none"); // Hide selection box
    svg.on("mousemove", null).on("mouseup", null); // Remove event listeners
  });
});

function lineIntersectsLine(p1, p2, q1, q2) {
  function crossProduct(a, b) {
    return a.x * b.y - a.y * b.x;
  }

  let r = { x: p2.x - p1.x, y: p2.y - p1.y };
  let s = { x: q2.x - q1.x, y: q2.y - q1.y };

  let rxs = crossProduct(r, s);
  let qpxr = crossProduct({ x: q1.x - p1.x, y: q1.y - p1.y }, r);

  if (rxs === 0) return false; // Lines are parallel or collinear

  let t = crossProduct({ x: q1.x - p1.x, y: q1.y - p1.y }, s) / rxs;
  let u = qpxr / rxs;

  return (t >= 0 && t <= 1 && u >= 0 && u <= 1);
}

function lineIntersectsRect(line, rect) {
  let { x, y, width, height } = rect;

  let rectEdges = [
    [{ x, y }, { x: x + width, y }],            // Top edge
    [{ x: x + width, y }, { x: x + width, y: y + height }], // Right edge
    [{ x: x + width, y: y + height }, { x, y: y + height }], // Bottom edge
    [{ x, y: y + height }, { x, y }]            // Left edge
  ];

  for (let edge of rectEdges) {
    if (lineIntersectsLine(line[0], line[1], edge[0], edge[1])) {
      return true;
    }
  }

  return false;
}

