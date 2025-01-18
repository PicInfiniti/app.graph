export function getMinAvailableNumber(existingNumbers) {
  // Convert strings to numbers and create a Set for fast lookup
  const numberSet = new Set(existingNumbers.map(Number));

  // Start checking from 1
  let minNumber = 1;

  // Increment until we find a missing number
  while (numberSet.has(minNumber)) {
    minNumber++;
  }

  return minNumber;
}


export function getAvailableLabel(n, maxLength = 3) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const combinations = [];

  // Generate nth combination recursively
  function generateNthCombination(prefix, start, remaining) {
    if (remaining === 0) {
      combinations.push(prefix);
      return;
    }

    for (let i = start; i < alphabet.length; i++) {
      generateNthCombination(prefix + alphabet[i], i + 1, remaining - 1);
      if (combinations.length > n) {
        return; // Stop early if we found the nth combination
      }
    }
  }

  let currentLength = 1;
  while (combinations.length <= n && currentLength <= maxLength) {
    generateNthCombination('', 0, currentLength);
    currentLength++;
  }

  return combinations[n - 1] || null; // Return nth combination or null if out of bounds
}

