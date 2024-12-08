const express = require("express");
const router = express.Router();
const yahooFinance = require("yahoo-finance2").default;

router.get("/preview", async (req, res) => {
  try {
    const symbols = ["^IBEX", "^GDAXI", "^STOXX50E"];
    const results = await Promise.allSettled(symbols.map(symbol => yahooFinance.quote(symbol)));

    const stockData = results.map((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        const stock = result.value;

        // DEPURAR QUE COÑO IMPRIME
        console.log(`Datos para ${symbols[index]}:`, stock);

        let updatedTime = new Date(stock.regularMarketTime); // Leer como fecha ISO

        // FUERZO AL DIA ACTUAL
        const today = new Date();
        if (
          updatedTime.getDate() !== today.getDate() ||
          updatedTime.getMonth() !== today.getMonth() ||
          updatedTime.getFullYear() !== today.getFullYear()
        ) {
          console.warn(`La fecha de ${symbols[index]} no coincide con el día actual. Usando fecha actual.`);
          updatedTime = today; // Usar fecha actual
        }

        // FORMATEAR FECHA
        const formattedTime = updatedTime.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });

        return {
          index: symbols[index],
          value: stock.regularMarketPrice || "N/A",
          change: stock.regularMarketChangePercent
            ? `${stock.regularMarketChangePercent.toFixed(2)}%`
            : "N/A",
          updated: formattedTime,
        };
      } else {
        console.error(`Error al obtener datos para ${symbols[index]}:`, result.reason);
        return {
          index: symbols[index],
          value: "N/A",
          change: "N/A",
          updated: new Date().toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }),
        };
      }
    });

    res.json(stockData);
  } catch (error) {
    console.error("Error en el servidor:", error.message);
    res.status(500).json({ error: "No se pudieron obtener los datos." });
  }
});

module.exports = router;
