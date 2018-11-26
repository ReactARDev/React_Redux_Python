export function formatDate(d) {
  // handle the null case gracefully
  if (!d) {
    return '';
  }

  const date = new Date(d);

  if (isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().replace(/T.*/, '');
}
