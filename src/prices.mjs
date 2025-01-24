import "./polyfills";
import express from "express";

function createApp(database) {
  const app = express();

  app.put("/prices", (req, res) => {
    const type = req.query.type;
    const cost = parseInt(req.query.cost);
    database.setBasePrice(type, cost);
    res.json();
  });

  app.get("/prices", (req, res) => {
    const age = req.query.age ? parseInt(req.query.age) : undefined;
    const type = req.query.type;
    const baseCost = database.findBasePriceByType(type).cost;
    const plainDate = parsePlainDate(req.query.date);
    const cost = calculateCost(age, type, plainDate, baseCost);

    res.json({ cost });
  });

  function parsePlainDate(dateString) {
    if (dateString) {
      const [year, month, day] = dateString.split("-").map(Number);
      return Temporal.PlainDate.from({ year, month, day });
    }
  }

  function calculateCost(age, type, plainDate, baseCost) {
    if (type === "night") {
      return calculateCostForNightTicket(age, baseCost);
    } else {
      return calculateCostForDayTicket(age, plainDate, baseCost);
    }
  }

  function calculateCostForNightTicket(age, baseCost) {
    if (age === undefined || age < 6) {
      return 0;
    }
    if (age > 64) {
      return Math.ceil(baseCost * 0.4);
    }
    return baseCost;
  }

  function calculateCostForDayTicket(age, plainDate, baseCost) {
    const reduction = calculateReduction(plainDate);

    if (age === undefined) {
      return Math.ceil(baseCost * (1 - reduction / 100));
    }
    if (age < 6) {
      return 0;
    }
    if (age < 15) {
      return Math.ceil(baseCost * 0.7);
    }
    if (age > 64) {
      return Math.ceil(baseCost * 0.75 * (1 - reduction / 100));
    }
    return Math.ceil(baseCost * (1 - reduction / 100));
  }

  function calculateReduction(plainDate) {
    if (plainDate && isMonday(plainDate) && !isHoliday(plainDate)) {
      return 35;
    }
    return 0;
  }

  function isMonday(plainDate) {
    return plainDate.dayOfWeek === 1;
  }

  function isHoliday(plainDate) {
    const holidays = database.getHolidays();
    for (let row of holidays) {
      const holiday = Temporal.PlainDate.from(row.holiday);
      if (
        plainDate.year === holiday.year &&
        plainDate.month === holiday.month &&
        plainDate.day === holiday.day
      ) {
        return true;
      }
    }
    return false;
  }

  return app;
}

export { createApp };
