/** Shuffle display positions while preserving canonical indices for server scoring
 * and historical attempt review. Called once when an attempt is opened.
 */
export function quizOptionOrder(count: number, random: () => number = Math.random): number[] {
  const order = Array.from({ length: count }, (_, index) => index);
  for (let index = order.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [order[index], order[target]] = [order[target], order[index]];
  }
  return order;
}
