import $ from "jquery"
import { canvas, History } from "../init"

$('#new-btn').on('click', function () {
  History.graph.clear();
  drawGraph(History.graph, canvas);
});

$('#export-graph').on('click', function () {
  const graphJSON = History.graph.export();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graphJSON, null, 2));
  const downloadAnchor = $('<a>')
    .attr('href', dataStr)
    .attr('download', 'graph.json');
  downloadAnchor[0].click(); // Trigger download
});

$('#import-graph').on('click', function () {
  $('#file-input').click(); // Open file dialog
});

$('#export-png').on('click', function () {
  downloadCanvasAsPNG()
  console.log("download png")
});

$('#file-input').on('change', function (event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const importedData = JSON.parse(e.target.result);

      History.graph.clear();
      History.graph.import(importedData)

      // Re-draw the graph
      drawGraph(History.graph, canvas);
    };
    reader.readAsText(file);
  }
});

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "n":
      updateHistory(History, "update")
      History.graph.clear();
      drawGraph(History.graph, canvas);
      break;
    case "o":
      $('#file-input').click(); // Open file dialog
      break;
    case "p":
      downloadCanvasAsPNG()
      console.log("download png")
      break;
    case "s":
      const graphJSON = History.graph.export();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graphJSON, null, 2));
      const downloadAnchor = $('<a>')
        .attr('href', dataStr)
        .attr('download', 'graph.json');
      downloadAnchor[0].click(); // Trigger download
      break;

    default:
      break;
  }
});

function downloadCanvasAsPNG() {
  const link = document.createElement("a");
  link.download = "d3_canvas.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
