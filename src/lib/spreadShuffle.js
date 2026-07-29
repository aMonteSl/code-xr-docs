// Category-aware shuffling for the screenshot carousel. Pure functions, no
// React.
//
// The requirement: a semi-random order that (a) never repeats an item,
// (b) never clumps items from the same directory back to back, and (c) keeps
// the mix proportional to how many images each category has. All three fall
// out of building ONE full permutation up front:
//   1. Fisher-Yates shuffle inside each group.
//   2. Repeatedly pick the next item from a random group, weighted by how
//      many items each group still has, excluding the group of the previous
//      pick whenever any other group still has stock.
// (a) is structural — it is a permutation. (b) is the exclusion. (c) is the
// weighting. When only the largest group has items left (guide/ ends up here:
// it holds ~12 of 42), same-group adjacency at the tail is mathematically
// unavoidable and allowed.

const shuffleInPlace = (items, random) => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
};

export const buildSpreadSequence = (items, getGroup, random = Math.random) => {
  const groups = new Map();

  for (const item of items) {
    const key = getGroup(item);

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(item);
  }

  for (const bucket of groups.values()) {
    shuffleInPlace(bucket, random);
  }

  const sequence = [];
  let previousGroup = null;

  while (sequence.length < items.length) {
    const eligible = [...groups.entries()].filter(
      ([key, bucket]) =>
        bucket.length > 0 &&
        // Exclude the previous group unless it is the only one with stock.
        (key !== previousGroup ||
          ![...groups.entries()].some(([k, b]) => k !== previousGroup && b.length > 0))
    );

    // Weighted pick: a group's chance is proportional to its remaining items.
    const total = eligible.reduce((sum, [, bucket]) => sum + bucket.length, 0);
    let roll = random() * total;
    let chosen = eligible[eligible.length - 1];

    for (const entry of eligible) {
      roll -= entry[1].length;

      if (roll < 0) {
        chosen = entry;
        break;
      }
    }

    sequence.push(chosen[1].pop());
    previousGroup = chosen[0];
  }

  return sequence;
};
