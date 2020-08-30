async function run() {
  const res = await fetch(`/api/v0/logs${location.search}`);
  const data = await res.json();
  createTable(data);
}
