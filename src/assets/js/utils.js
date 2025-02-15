import { connectedComponents } from "graphology-components";

export function getMinAvailableNumber(existingNumbers) {
  const numberSet = new Set(existingNumbers.map(Number));
  let minNumber = 0;

  while (numberSet.has(minNumber)) {
    minNumber++;
  }

  return minNumber;
}

export function getAvailableLabel(n, maxLength = 3) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const combinations = [];

  function generateNthCombination(prefix, start, remaining) {
    if (remaining === 0) {
      combinations.push(prefix);
      return;
    }

    for (let i = start; i < alphabet.length; i++) {
      generateNthCombination(prefix + alphabet[i], i + 1, remaining - 1);
      if (combinations.length > n) return;
    }
  }

  let currentLength = 1;
  while (combinations.length <= n && currentLength <= maxLength) {
    generateNthCombination('', 0, currentLength);
    currentLength++;
  }

  return combinations[n] || null;
}

export const includesById = (array, id) => array.some(obj => obj.id === id);

export function removeString(array, str) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (array[i] === str) {
      array.splice(i, 1);
    }
  }
}

export class LimitedArray {
  constructor(limit) {
    this.limit = limit;
    this.index = -1;
    this.data = [];
    this.graph = null;
  }

  push(value) {
    if (this.data.length >= this.limit) {
      this.data.shift();
    }
    this.data.push(value);
    this.index = this.data.length - 1;
    this.graph = this.data[this.index];
  }

  getArray() {
    return this.data;
  }

  getIndex(index) {
    return this.data[index] ?? null;
  }

  updateIndex(value) {
    if (value >= 0 && value < this.data.length) {
      this.index = value;
      this.graph = this.data[value];
    }
  }
}

export function getTouchPosition(event, svg) {
  const touch = event.changedTouches[0];
  const rect = svg.node().getBoundingClientRect();
  return [touch.clientX - rect.left, touch.clientY - rect.top];
}


export function getComponent(graph, node) {
  // Get all connected components
  const components = connectedComponents(graph);

  // Find the component that contains the given node
  for (let component of components) {
    if (component.includes(node)) {
      return component;
    }
  }

  return null; // If node is not found in any component
}


export function lineIntersectsRect(line, rect) {
  let [x1, y1, x2, y2] = line;  // Line segment coordinates
  let [a, b, c, d] = rect;  // Rectangle properties

  // Check if the line intersects any of the rectangle's edges
  if (lineIntersectsLine([x1, y1, x2, y2], [a, b, c, d])) {
    return true;  // Intersection found
  }
  if (lineIntersectsLine([x1, y1, x2, y2], [a, d, c, b])) {
    return true;  // Intersection found
  }
  return false;  // No intersection
}

// returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
function lineIntersectsLine(line1, line2) {
  var det, gamma, lambda;
  const [a, b, c, d] = line1
  const [p, q, r, s] = line2
  det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  } else {
    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }
};

export function pointInRect(a, b, x1, y1, x2, y2) {
  if (a >= x1 && a <= x2 && b >= y1 && b <= y2) {
    return true
  } else {
    return false
  }
}
