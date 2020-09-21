export default function rarityForPercentile(percentile: number) {
  if (percentile > 99) {
    return 'legendary';
  } else if (percentile > 95) {
    return 'ascended';
  } else if (percentile > 90) {
    return 'exotic';
  } else if (percentile > 80) {
    return 'rare';
  } else if (percentile > 70) {
    return 'masterwork';
  } else if (percentile > 60) {
    return 'fine';
  } else if (percentile > 50) {
    return 'basic';
  }
  return 'junk';
}
