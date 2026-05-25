(function () {
  const hotelNames = [
    "JRイン札幌",
    "三井ガーデンホテル札幌",
    "リッチモンドホテル札幌駅前",
    "ホテルJALシティ札幌 中島公園"
  ];

  const eventMap = {
    "2026-06-06": "札幌ドーム 大型コンサート",
    "2026-06-14": "札幌市内 学会・展示会",
    "2026-07-20": "大通公園 夏季イベント",
    "2026-08-08": "札幌ドーム スポーツイベント",
    "2026-08-15": "お盆観光ピーク",
    "2026-09-19": "連休 市内イベント"
  };

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function toDateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function getEventBoost(dateKey) {
    if (dateKey === "2026-06-06") return 1.3;
    if (dateKey === "2026-06-14") return 1.18;
    if (dateKey === "2026-07-20") return 1.15;
    if (dateKey === "2026-08-08") return 1.22;
    if (dateKey === "2026-08-15") return 1.28;
    if (dateKey === "2026-09-19") return 1.2;
    return 1;
  }

  function getSeasonBoost(month) {
    if ([7, 8].includes(month)) return 1.15;
    if ([6, 9].includes(month)) return 1.06;
    return 1;
  }

  function getWeekendBoost(day) {
    if (day === 6) return 1.22;
    if (day === 5) return 1.12;
    if (day === 0) return 1.06;
    return 1;
  }

  function createHotelPrices(multiplier, phase) {
    const start = new Date(2026, 4, 25);
    return Array.from({ length: 92 }, (_, index) => {
      const date = addDays(start, index);
      const dateKey = toDateKey(date);
      const month = date.getMonth() + 1;
      const day = date.getDay();
      const baseDemand = 12000
        * getSeasonBoost(month)
        * getWeekendBoost(day)
        * getEventBoost(dateKey);
      const wave = 1 + Math.sin((index + phase) / 8) * 0.07;
      const hotels = hotelNames.map((name, hotelIndex) => {
        const hotelWeight = 0.94 + hotelIndex * 0.055;
        const price = Math.round(baseDemand * wave * hotelWeight * multiplier / 100) * 100;
        return { name, price };
      });
      return { date: dateKey, hotels };
    });
  }

  function createOwnListingPrices() {
    const start = new Date(2026, 4, 25);
    return Array.from({ length: 92 }, (_, index) => {
      const date = addDays(start, index);
      const day = date.getDay();
      const dateKey = toDateKey(date);
      const currentBoost = day === 6 ? 1.18 : day === 5 ? 1.1 : 1;
      return {
        date: dateKey,
        currentPrice: Math.round(12000 * currentBoost / 500) * 500,
        basePrice: 12000,
        minPrice: 8000,
        maxPrice: 35000
      };
    });
  }

  function createAccessLogs() {
    const start = new Date(2026, 4, 25);
    return Array.from({ length: 92 }, (_, index) => {
      const date = addDays(start, index);
      const dateKey = toDateKey(date);
      const normalAccess = 44 + (index % 7) * 3;
      const spike = ["2026-06-06", "2026-08-08", "2026-08-15"].includes(dateKey);
      return {
        date: dateKey,
        normalAccess,
        todayAccess: spike ? Math.round(normalAccess * 2.4) : Math.round(normalAccess * (0.85 + (index % 5) * 0.08))
      };
    });
  }

  window.sampleData = {
    hotelPricesThisWeek: createHotelPrices(1.08, 1),
    hotelPricesOneWeekAgo: createHotelPrices(1, 4),
    hotelPricesTwoWeeksAgo: createHotelPrices(0.96, 7),
    ownListingPrices: createOwnListingPrices(),
    events: Object.entries(eventMap).map(([date, name]) => ({ date, name })),
    accessLogs: createAccessLogs()
  };
})();
