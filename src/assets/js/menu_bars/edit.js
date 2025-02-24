import $ from "jquery"
import { canvas, History, updateGraph, addLink, nodes } from "../init"
import { updateHistory } from "../utils";
import { circular } from "graphology-library/layout";
import { updateNodePostion, updateNodeForce } from "../utils";
// Attach the circular layout function to the button
$("[name='organize-circle']").on("click", function () {
  updateHistory(History, "update")
  organizeNodesInCircle(History.graph, canvas)
  updateGraph(History.graph);
});

$('[name="make-complete-btn"]').on('click', () => {
  makeGraphComplete(History.graph);
  updateGraph(History.graph)
});

$('[name="remove-selection-btn"]').on('click', removeSelection);
$('[name="color-selection-btn"]').on('click', colorSelection);
$('[name="add-edge-btn"]').on('click', addEdge);


export function organizeNodesInCircle(graph, canvas) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX * 0.8, centerY * 0.8);
  const positions = circular(graph, { scale: radius, dimensions: ['x', 'y'] });
  updateNodePostion(graph, positions, { x: centerX, y: centerY })
  updateNodeForce(graph, nodes)
}

function makeGraphComplete(graph, color = null) {
  for (let i = 0; i < graph.order; i++) {
    for (let j = i + 1; j < graph.order; j++) {
      History.graph.mergeEdge(i, j, { color: color ? color : $("#color").val() }); // Add edge if it doesn't exist
      addLink(i, j)
    }
  }
}

function removeSelection() {
  updateHistory(History, "update")
  for (let edge of selectedEdge) {
    History.graph.dropEdge(edge); // Remove the selected node
  }
  for (let node of selectedNode) {
    History.graph.dropNode(node); // Remove the selected node
  }
}

function colorSelection() {
  const color = $("#color").val()
  updateHistory(History, "update")

  for (let node of selectedNode) {
    History.graph.updateNodeAttributes(node, attr => {
      return {
        ...attr,
        color: color,
      };
    })
  }

  for (let edge of selectedEdge) {
    History.graph.updateEdgeAttributes(edge, attr => {
      return {
        ...attr,
        color: color,
      };
    });
  }
}


function addEdge() {
  const color = $("#color").val()
  updateHistory(History, "update")
  for (let source of selectedNode) {
    for (let target of selectedNode) {
      if (source != target) {
        if (!History.graph.hasEdge(source, target) && !History.graph.hasEdge(target, source)) {
          History.graph.addEdge(source, target, { color: color }); // Add edge if it doesn't exist
        }
      }
    }
  }
}

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "C":
      updateHistory(History, "update")
      makeGraphComplete(History.graph);
      updateGraph(History.graph)
      break;
    case "O":
      updateHistory(History, "update")
      organizeNodesInCircle(History.graph, canvas)
      updateGraph(History.graph);
      break;
    case "d":
      removeSelection();
      break;

    case "c":
      colorSelection();
      break;

    case "e":
      addEdge();
      break;

    case "u":
      updateHistory(History, "undo")
      break;

    case "y":
      updateHistory(History, "redo")
      break;

    default:
      break;
  }
});

$('[name="undo-btn"]').on('click', function () {
  updateHistory(History, "undo"); // Update the graph to include the new node
});

$('[name="redo-btn"]').on('click', function () {
  updateHistory(History, "redo"); // Update the graph to include the new node
});



