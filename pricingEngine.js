(function () {
  function averageHotelPrice(dayPrice) {
    const total = dayPrice.hotels.reduce((sum, hotel) => sum + hotel.price, 0);
    return Math.round(total / dayPrice.hotels.length);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function roundToNearest(value, unit) {
    return Math.round(value / unit) * unit;
  }

  function limitWeeklyChange(price, currentPrice) {
    const lower = currentPrice * 0.7;
    const upper = currentPrice * 1.3;
    return clamp(price, lower, upper);
  }

  function createDecision(recommendedPrice, currentPrice) {
    const rate = currentPrice ? (recommendedPrice - currentPrice) / currentPrice : 0;
    if (rate >= 0.2) return { key: "strong_raise", label: "強く値上げ" };
    if (rate >= 0.05) return { key: "raise", label: "値上げ" };
    if (rate <= -0.05) return { key: "lower", label: "値下げ" };
    return { key: "keep", label: "維持" };
  }

  function createReason(row, hasAccessSpike) {
    const changePercent = (row.hotelChangeRate - 1) * 100;
    const reasons = [];
    if (changePercent >= 15) {
      reasons.push("ホテル平均価格が前週比で大きく上昇しているため、需要増加の可能性があります。");
    } else if (changePercent >= 5) {
      reasons.push("ホテル平均価格が前週比で上昇しているため、値上げ余地があります。");
    } else if (changePercent <= -5) {
      reasons.push("ホテル平均価格が前週比で下落しているため、価格調整を検討してください。");
    } else {
      reasons.push("ホテル価格に大きな変動がないため、現在価格の維持が妥当です。");
    }
    if (hasAccessSpike) {
      reasons.push("アクセス急増があるため、予約を安売りしないよう価格見直しを推奨します。");
    }
    return reasons.join("");
  }

  function isAccessSpike(accessLog) {
    return accessLog.todayAccess >= accessLog.normalAccess * 1.6;
  }

  function buildPricingRows(data, settings) {
    const previousMap = new Map(data.hotelPricesOneWeekAgo.map((item) => [item.date, item]));
    const ownMap = new Map(data.ownListingPrices.map((item) => [item.date, item]));
    const accessMap = new Map(data.accessLogs.map((item) => [item.date, item]));

    return data.hotelPricesThisWeek.map((item) => {
      const previous = previousMap.get(item.date);
      const own = ownMap.get(item.date);
      const accessLog = accessMap.get(item.date);
      const hotelAverage = averageHotelPrice(item);
      const previousHotelAverage = averageHotelPrice(previous);
      const hotelChangeRate = previousHotelAverage ? hotelAverage / previousHotelAverage : 1;
      const currentPrice = own.currentPrice;
      const basePrice = settings.basePrice || own.basePrice;
      const minPrice = settings.minPrice || own.minPrice;
      const maxPrice = settings.maxPrice || own.maxPrice;
      const minpakuFactor = settings.minpakuFactor || 0.85;
      const rawRecommendedPrice = basePrice * hotelChangeRate * minpakuFactor;
      const limitedPrice = limitWeeklyChange(rawRecommendedPrice, currentPrice);
      const recommendedPrice = roundToNearest(clamp(limitedPrice, minPrice, maxPrice), 500);
      const decision = createDecision(recommendedPrice, currentPrice);
      const hasAccessSpike = accessLog ? isAccessSpike(accessLog) : false;
      const row = {
        date: item.date,
        hotelAverage,
        previousHotelAverage,
        hotelChangeRate,
        currentPrice,
        basePrice,
        recommendedPrice,
        decision,
        accessLog,
        hasAccessSpike
      };
      return {
        ...row,
        reason: createReason(row, hasAccessSpike)
      };
    });
  }

  function buildChartSeries(data) {
    return {
      thisWeek: data.hotelPricesThisWeek.map((item) => ({ date: item.date, value: averageHotelPrice(item) })),
      oneWeekAgo: data.hotelPricesOneWeekAgo.map((item) => ({ date: item.date, value: averageHotelPrice(item) })),
      twoWeeksAgo: data.hotelPricesTwoWeeksAgo.map((item) => ({ date: item.date, value: averageHotelPrice(item) }))
    };
  }

  function buildAccessAlerts(data) {
    return data.accessLogs
      .filter(isAccessSpike)
      .map((log) => ({
        ...log,
        message: "アクセス急増。需要上昇の可能性があります。価格見直し、または一時ブロックを検討してください。"
      }));
  }

  window.pricingEngine = {
    averageHotelPrice,
    buildPricingRows,
    buildChartSeries,
    buildAccessAlerts
  };
})();
