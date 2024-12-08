document.addEventListener("DOMContentLoaded", async () => {
  const stockTable = document.getElementById("stockTable");

  const loadStockData = async () => {
    try {
      const response = await fetch("/stocks/preview");
      if (!response.ok) throw new Error("Error al obtener los datos del servidor.");
      const data = await response.json();

      // Limpiar la tabla
      stockTable.innerHTML = "";

      // Llenar la tabla con los datos
      data.forEach(stock => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${stock.index}</td>
          <td>${stock.value}</td>
          <td>${stock.change}</td>
          <td>${stock.updated}</td>
        `;
        stockTable.appendChild(row);
      });
    } catch (error) {
      stockTable.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-danger">Error al cargar los datos.</td>
        </tr>
      `;
      console.error("Error al cargar los datos:", error);
    }
  };

  // Cargar datos iniciales
  loadStockData();

  // Recargar datos cada 60 segundos
  setInterval(loadStockData, 60000);
});
