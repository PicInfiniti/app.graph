import { isGraphConstructor } from "graphology-library/assertions";
import { mergeStar } from "graphology-library/utils";


var ADJACENCY_NUMERIC = [
  [0, 1, 2, 3, 4],
  [1, 0, 5, 6],
  [2, 0, 3, 4],
  [3, 0, 1, 2, 5, 4, 6],
  [5, 1, 3, 6],
  [4, 0, 2, 3, 6, 7],
  [6, 1, 3, 5, 4, 7],
  [7, 4, 6, 8],
  [8, 7, 9],
  [9, 8]
];

export function krackhardtKite(GraphClass) {
  if (!isGraphConstructor(GraphClass))
    throw new Error(
      'invalid Graph constructor.'
    );

  var graph = new GraphClass(),
    i,
    l;

  for (i = 0, l = ADJACENCY_NUMERIC.length; i < l; i++) mergeStar(graph, ADJACENCY_NUMERIC[i]);

  return graph;
};


var EDGES_NUMERIC = [
  [0, 1],
  [2, 3],
  [2, 4],
  [2, 5],
  [1, 5],
  [1, 6],
  [1, 7],
  [1, 8],
  [1, 9],
  [9, 10],
  [3, 4],
  [3, 11],
  [4, 6],
  [4, 11],
  [6, 7],
  [7, 12],
  [8, 13],
  [8, 12],
  [11, 12],
  [12, 14]
];

export function florentineFamilies(GraphClass) {
  if (!isGraphConstructor(GraphClass))
    throw new Error(
      'graphology-generators/social/florentine-families: invalid Graph constructor.'
    );

  var graph = new GraphClass(),
    i,
    l;

  for (i = 0, l = EDGES_NUMERIC.length; i < l; i++) {
    graph.mergeEdge(EDGES_NUMERIC[i][0], EDGES_NUMERIC[i][1]);
  }

  return graph;
};

var DATA = [
  '0111111110111100010101000000000100',
  '1011000100000100010101000000001000',
  '1101000111000100000000000001100010',
  '1110000100001100000000000000000000',
  '1000001000100000000000000000000000',
  '1000001000100000100000000000000000',
  '1000110000000000100000000000000000',
  '1111000000000000000000000000000000',
  '1010000000000000000000000000001011',
  '0010000000000000000000000000000001',
  '1000110000000000000000000000000000',
  '1000000000000000000000000000000000',
  '1001000000000000000000000000000000',
  '1111000000000000000000000000000001',
  '0000000000000000000000000000000011',
  '0000000000000000000000000000000011',
  '0000011000000000000000000000000000',
  '1100000000000000000000000000000000',
  '0000000000000000000000000000000011',
  '1100000000000000000000000000000001',
  '0000000000000000000000000000000011',
  '1100000000000000000000000000000000',
  '0000000000000000000000000000000011',
  '0000000000000000000000000101010011',
  '0000000000000000000000000101000100',
  '0000000000000000000000011000000100',
  '0000000000000000000000000000010001',
  '0010000000000000000000011000000001',
  '0010000000000000000000000000000101',
  '0000000000000000000000010010000011',
  '0100000010000000000000000000000011',
  '1000000000000000000000001100100011',
  '0010000010000011001010110000011101',
  '0000000011000111001110110011111110'
];

var CLUB1 = new Set([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 16, 17, 19, 21
]);

export function karateClub(GraphClass) {
  if (!isGraphConstructor(GraphClass))
    throw new Error(
      'graphology-generators/social/karate: invalid Graph constructor.'
    );

  var graph = new GraphClass(),
    club;

  for (var i = 0; i < 34; i++) {
    club = CLUB1.has(i) ? 'Mr. Hi' : 'Officer';

    graph.addNode(i, { club: club });
  }

  var line, entry, row, column, l, m;

  for (row = 0, l = DATA.length; row < l; row++) {
    line = DATA[row].split('');

    for (column = row + 1, m = line.length; column < m; column++) {
      entry = +line[column];

      if (entry) graph.addEdgeWithKey(row + '->' + column, row, column);
    }
  }

  return graph;
};

