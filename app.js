(function () {
  const yen = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  });

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const inputs = {
    basePrice: document.querySelector("#basePrice"),
    minPrice: document.querySelector("#minPrice"),
    maxPrice: document.querySelector("#maxPrice"),
    minpakuFactor: document.querySelector("#minpakuFactor")
  };

  function getSettings() {
    return {
      basePrice: Number(inputs.basePrice.value),
      minPrice: Number(inputs.minPrice.value),
      maxPrice: Number(inputs.maxPrice.value),
      minpakuFactor: Number(inputs.minpakuFactor.value)
    };
  }

  function formatPercent(value) {
    return `${((value - 1) * 100).toFixed(1)}%`;
  }

  function getWeekday(dateKey) {
    return weekdays[new Date(`${dateKey}T00:00:00`).getDay()];
  }

  function createPath(series, bounds, width, height, padding) {
    const xStep = (width - padding.left - padding.right) / (series.length - 1);
    return series.map((point, index) => {
      const x = padding.left + xStep * index;
      const y = padding.top + (bounds.max - point.value) / (bounds.max - bounds.min) * (height - padding.top - padding.bottom);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  }

  function renderChart(series) {
    const chart = document.querySelector("#chart");
    const allValues = [...series.thisWeek, ...series.oneWeekAgo, ...series.twoWeeksAgo].map((item) => item.value);
    const min = Math.floor(Math.min(...allValues) / 1000) * 1000;
    const max = Math.ceil(Math.max(...allValues) / 1000) * 1000;
    const bounds = { min, max };
    const width = 1120;
    const height = 330;
    const padding = { top: 18, right: 30, bottom: 44, left: 72 };
    const gridValues = Array.from({ length: 5 }, (_, index) => min + (max - min) / 4 * index);
    const labelIndexes = [0, 15, 30, 45, 60, 75, 91];
    const svg = `
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="ホテル平均価格推移">
        ${gridValues.map((value) => {
          const y = padding.top + (bounds.max - value) / (bounds.max - bounds.min) * (height - padding.top - padding.bottom);
          return `
            <line class="grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>
            <text class="axis-label" x="12" y="${y + 4}">${yen.format(value)}</text>
          `;
        }).join("")}
        ${labelIndexes.map((index) => {
          const x = padding.left + (width - padding.left - padding.right) / (series.thisWeek.length - 1) * index;
          const label = series.thisWeek[index] ? series.thisWeek[index].date.slice(5) : "";
          return `<text class="axis-label" x="${x - 14}" y="${height - 14}">${label}</text>`;
        }).join("")}
        <path d="${createPath(series.twoWeeksAgo, bounds, width, height, padding)}" fill="none" stroke="#9333ea" stroke-width="3"></path>
        <path d="${createPath(series.oneWeekAgo, bounds, width, height, padding)}" fill="none" stroke="#2563eb" stroke-width="3"></path>
        <path d="${createPath(series.thisWeek, bounds, width, height, padding)}" fill="none" stroke="#0f766e" stroke-width="4"></path>
      </svg>
    `;
    chart.innerHTML = svg;
  }

  function renderPricingRows(rows) {
    document.querySelector("#pricingRows").innerHTML = rows.map((row) => `
      <tr>
        <td>${row.date}</td>
        <td>${getWeekday(row.date)}</td>
        <td>${yen.format(row.hotelAverage)}</td>
        <td>${yen.format(row.previousHotelAverage)}</td>
        <td>${formatPercent(row.hotelChangeRate)}</td>
        <td>${yen.format(row.currentPrice)}</td>
        <td>${yen.format(row.basePrice)}</td>
        <td><strong>${yen.format(row.recommendedPrice)}</strong></td>
        <td><span class="badge ${row.decision.key}">${row.decision.label}</span></td>
        <td class="reason">${row.reason}</td>
      </tr>
    `).join("");
  }

  function renderEvents(events) {
    document.querySelector("#eventCalendar").innerHTML = events.map((event) => `
      <article class="event-card">
        <div class="event-date">${event.date}（${getWeekday(event.date)}）</div>
        <div class="event-name">${event.name}</div>
      </article>
    `).join("");
  }

  function renderAlerts(alerts) {
    const alertList = document.querySelector("#alertList");
    if (!alerts.length) {
      alertList.innerHTML = `<div class="alert-item">現在、アクセス急増アラートはありません。</div>`;
      return;
    }
    alertList.innerHTML = alerts.slice(0, 5).map((alert) => `
      <div class="alert-item">
        ${alert.date}：通常${alert.normalAccess}件 / 当日${alert.todayAccess}件。${alert.message}
      </div>
    `).join("");
  }

  function render() {
    const settings = getSettings();
    const rows = window.pricingEngine.buildPricingRows(window.sampleData, settings);
    const series = window.pricingEngine.buildChartSeries(window.sampleData);
    const alerts = window.pricingEngine.buildAccessAlerts(window.sampleData);
    renderChart(series);
    renderPricingRows(rows);
    renderEvents(window.sampleData.events);
    renderAlerts(alerts);
  }

  Object.values(inputs).forEach((input) => {
    input.addEventListener("input", render);
    input.addEventListener("change", render);
  });

  render();
})();
