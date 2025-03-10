import * as d3 from 'd3';
import { EventBus } from './eventBus.js';
import { GraphManager } from '../graph/graphManager.js';
import { KeyHandler } from './keyHandler.js';
import AppSettings from './state.js';
import { createMenu } from '../ui/menu.js';
import { getAvailableLabel, getMinAvailableNumber } from '../utils/helperFunctions.js';


export class App {
  constructor() {
    this.graphManager = new GraphManager();  // Handles graph logic
    this.canvas = d3.select("#chart").node();
    this.appSettings = new AppSettings(EventBus);
    this.simulation = null;
    this.nodes = [];
    this.links = [];

    // Rectangle properties
    this.selection = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      active: false
    };

    this.init()
  }

  init() {
    createMenu()
    this.appSettings.init()
    this.initCanvas();
    KeyHandler.init();  // Handle global keyboard shortcuts
    this.loadInitialGraph();
    this.setupEventListeners();
    this.initSimulation()

  }

  addNodeAtEvent(event) {
    event.preventDefault();

    let [x, y] = d3.pointer(event, this.canvas);
    const newID = getMinAvailableNumber(this.graphManager.graph.nodes());
    const newLabel = getAvailableLabel(newID);
    this.graphManager.graph.addNode(newID, { x, y, color: this.appSettings.settings.color, label: newLabel });
    EventBus.emit('graph:updated', { type: 'addNode', node: newID })
  }

  initCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.addEventListener("dblclick", (event) => {
      this.addNodeAtEvent(event)
    });

    d3.select(this.canvas)
      .call(
        d3.drag()
          .container(this.canvas)
          .subject(this.dragsubject.bind(this))  // 👈 Bind this
          .on("start", this.dragstarted.bind(this))
          .on("drag", this.dragged.bind(this))
          .on("end", this.dragended.bind(this))
      );

    // Add mouse event listeners for rectangle dragging
    this.canvas.addEventListener("mousedown", (event) => this.startSelection(event));
    this.canvas.addEventListener("mousemove", (event) => this.updateSelection(event));
    this.canvas.addEventListener("mouseup", () => this.endSelection());

  }

  initSimulation() {
    this.nodes = this.graphManager.graph.getNodesForD3();
    this.links = this.graphManager.graph.getEdgesForD3();

    this.simulation = d3.forceSimulation(this.nodes)
      .force("link", d3.forceLink(this.links)
        .id(d => d.id)
        .distance(10)       // Increased link distance
        .strength(0.5))      // Moderate link strength
      .force("charge", d3.forceManyBody()
        .strength(-300))     // Stronger negative value for repulsion
      .force("collide", d3.forceCollide(20)) // Prevents node overlap
      .force("center", d3.forceCenter(this.canvas.width / 2, this.canvas.height / 2))
      .force("x", d3.forceX(this.canvas.width / 2).strength(0.05))  // Gentle attraction to center
      .force("y", d3.forceY(this.canvas.height / 1).strength(0.05)) // Gentle attraction to center
      .velocityDecay(0.3)     // Slower decay for smoother stabilization
      .alphaDecay(0.02)       // Slower cooling, better final spread
      .on("tick", this.ticked.bind(this))

    if (!this.appSettings.settings.forceSimulation) {
      this.simulation.stop()
    }
  }

  loadInitialGraph() {
    this.graphManager.applyLayout('circle', this.canvas)
    this.drawGraph();  // Visualize the graph
  }

  setupEventListeners() {
    // When layout changes (e.g., user selects new layout from UI)
    EventBus.on('layout:changed', (event) => {
      const { layoutType } = event.detail;
      this.graphManager.applyLayout(layoutType);
      EventBus.emit('graph:updated', { type: "layout" });
    });

    // When graph data updates, re-render visualization
    EventBus.on('graph:updated', (event) => {
      this.drawGraph();  // Visualize the graph
      const updateTypes = ["addNode", "undo", "redo", "clear", "import"];
      if (updateTypes.includes(event.detail.type)) {
        this.updateSimulation();
      }
    });

    // Toggle simulation based on UI interactions
    EventBus.on('simulation:toggled', (event) => {
    });

    // Example: Key event to toggle simulation
    EventBus.on('key:pressed', (event) => {

    });

    EventBus.on('settingToggled', (event) => {
      const { key, value } = event.detail
      if (key == 'forceSimulation') {
        if (value) {
          this.startSimulation()
        } else {
          this.stopSimulation()
        }
      }
    })

    EventBus.on("import", (event) => {
      document.getElementById("file-input").click(); // Open file dialog
    })

    EventBus.on("export", (event) => {
      if (event.detail.type === "json") {
        const graphJSON = this.graphManager.graph.export();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graphJSON, null, 2));

        const downloadAnchor = document.createElement("a");
        downloadAnchor.href = dataStr;
        downloadAnchor.download = "graph.json";

        document.body.appendChild(downloadAnchor); // Append to the document
        downloadAnchor.click(); // Trigger download
        document.body.removeChild(downloadAnchor); // Clean up
      }

      if (event.detail.type === "png") {
        this.canvas.toBlob(function (blob) {
          let link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "d3-canvas-export.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, "image/png");
      }
    });

    document.getElementById("file-input").addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const importedData = JSON.parse(e.target.result);
          console.log("Imported Data:", importedData); // Debugging

          const newGraph = this.graphManager.graph.copy();
          this.graphManager.push(newGraph); // Make sure `push` is defined
          newGraph.clear();
          this.graphManager.graph.import(importedData);

          EventBus.emit("graph:updated", { type: "import" });
        };
        reader.readAsText(file);
      }
    });

  }

  dragsubject(event) {
    const x = event.x;
    const y = event.y;
    let subject = null;
    let minDist = Infinity;

    this.nodes.forEach((node) => {
      const dx = x - node.x;
      const dy = y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 10 && dist < minDist) {
        minDist = dist;
        subject = node;
      }
    });

    return subject;
  }

  dragstarted(event) {
    if (!event.active && this.appSettings.settings.forceSimulation) {
      this.simulation.alphaTarget(0.3).restart()
    }
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;

    if (!this.appSettings.settings.forceSimulation) {
      this.graphManager.graph.updateNodeAttributes(event.subject.id, attr => {
        return {
          ...attr,
          x: event.x,
          y: event.y
        };
      });
      this.drawGraph()
    }
  }

  dragended(event) {
    if (!event.active) this.simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
    event.subject.x = event.x;
    event.subject.y = event.y;
  }

  drawGraph() {
    const graph = this.graphManager.graph
    const canvas = this.canvas
    const settings = this.appSettings.settings

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    graph.forEachEdge(function (edge, attr, s, t, source, target) {
      if (!attr.color) {
        graph.setEdgeAttribute(edge, "color", settings.color)
      }
      context.beginPath();
      context.moveTo(source.x, source.y);
      context.lineTo(target.x, target.y);
      context.strokeStyle = attr.color;
      context.lineWidth = settings.edge_size;
      context.stroke();
      context.closePath();
    });

    // Draw nodes
    graph.forEachNode(function (node, attr) {
      if (!attr.label) {
        const newLabel = getAvailableLabel(node);
        graph.setNodeAttribute(node, "label", newLabel)
      }
      if (!attr.color) {
        graph.setNodeAttribute(node, "color", settings.color)
      }
      context.beginPath();
      context.arc(attr.x, attr.y, settings.node_radius, 0, 2 * Math.PI);
      context.fillStyle = settings.vertexLabel ? "white" : attr.color;
      context.fill();
      context.lineWidth = 3;
      context.strokeStyle = attr.color;
      context.stroke();
      context.closePath();

      if (settings.vertexLabel) {
        context.fillStyle = "black";
        context.font = `${settings.label_size}px sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(attr.label, attr.x, attr.y);
      }
    });


    // Draw rectangles
    this.drawRectangles(context);
  }

  ticked() {
    // Draw nodes
    this.nodes.forEach((d) => {
      this.graphManager.graph.updateNodeAttributes(d.id, attr => {
        return {
          ...attr,
          x: d.x,
          y: d.y
        };
      });
    });
    EventBus.emit('graph:updated', { type: 'position' })
  }

  startSimulation() {
    this.simulation.alpha(.3).restart(); // Reheat simulation after updates
  }

  stopSimulation() {
    this.simulation.stop();
  }

  updateSimulation() {
    this.nodes.length = 0;
    this.nodes = this.graphManager.graph.getNodesForD3()

    this.links.length = 0;
    this.links = this.graphManager.graph.getEdgesForD3()

    this.simulation.nodes(this.nodes);
    this.simulation.force("link").links(this.links);
    if (this.appSettings.settings.forceSimulation) {
      this.startSimulation()
    } else {
      this.stopSimulation()
    }
  }

  updateForce() {
    const graph = this.graphManager.graph

    this.nodes.length = 0
    graph.forEachNode((node, attr) => {
      this.nodes.push(
        {
          id: Number(node),
          x: attr.x,
          y: attr.y
        }
      )
    })

    this.links.length = 0
    graph.forEachEdge(function (edge, attr, s, t, source, target) {
      this.links.push(
        {
          source: Number(s),
          target: Number(t)
        }
      )
    })
  }

  drawRectangles(context) {
    if (this.selection.active && !this.appSettings.settings.forceSimulation) {
      context.fillStyle = "rgba(0, 0, 255, 0.1)"; // Semi-transparent blue fill
      context.fillRect(
        this.selection.x,
        this.selection.y,
        this.selection.width,
        this.selection.height
      );

      context.strokeStyle = "rgba(0, 0, 255, 0.7)"; // Blue outline
      context.lineWidth = 2;
      context.setLineDash([5, 5]); // Dashed border effect
      context.strokeRect(
        this.selection.x,
        this.selection.y,
        this.selection.width,
        this.selection.height
      );
      context.setLineDash([]); // Reset line style
    }
  }

  // Dragging logic

  startSelection(event) {
    const [mouseX, mouseY] = d3.pointer(event, this.canvas);
    this.selection.x = mouseX;
    this.selection.y = mouseY;
    this.selection.width = 0;
    this.selection.height = 0;
    this.selection.active = true;
  }

  updateSelection(event) {
    if (!this.selection.active) return;

    const [mouseX, mouseY] = d3.pointer(event, this.canvas);
    this.selection.width = mouseX - this.selection.x;
    this.selection.height = mouseY - this.selection.y;
    this.drawGraph();  // Redraw canvas with the selection rectangle
  }

  endSelection() {
    this.selection.active = false;
    this.drawGraph();  // Redraw to remove rectangle
  }

}


