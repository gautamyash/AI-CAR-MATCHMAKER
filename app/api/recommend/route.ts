import carsData from "@/app/data/cars.json";

type CarType = "SUV" | "Sedan" | "Hatchback";
type Transmission = "Automatic" | "Manual";

type Car = {
  id: number;
  name: string;
  brand: string;
  price: number;
  mileage: number;
  safety: number;
  type: CarType;
  fuelType: string;
  transmission: Transmission;
  seatingCapacity: number;
  bootSpace: number;
  cityUse: boolean;
  highwayUse: boolean;
};

type RecommendBody = {
  query?: string;
  queries?: string[];
  prompt?: string;
};

type SearchIntent = {
  budget?: number;
  budgetType?: "under" | "above";
  type?: CarType;
  wantsMileage: boolean;
  wantsSafety: boolean;
  wantsFamily: boolean;
  wantsEV: boolean;
  transmission?: Transmission;
  familySize?: number;
  useCase?: "city" | "highway";
};

const cars = carsData as Car[];

// Helper functions for repeated logic
function checkQueryFor(
  query: string,
  keywords: { text: string; value: string }[],
): string | undefined {
  for (const { text, value } of keywords) {
    if (query.includes(text)) {
      return value;
    }
  }
  return undefined;
}

function addScoreIf(
  condition: boolean,
  score: number,
  currentScore: number,
): number {
  return condition ? currentScore + score : currentScore;
}

function getQueryText(body: RecommendBody): string {
  const parts = [
    body.query,
    body.prompt,
    ...(Array.isArray(body.queries) ? body.queries : []),
  ];

  return parts.filter(Boolean).join(" ").toLowerCase();
}

function parseBudget(query: string): {
  amount?: number;
  type?: "under" | "above";
} {
  const croreMatch = query.match(/(\d+(?:\.\d+)?)\s*(cr|crore|crores)/);
  const lakhMatch = query.match(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|l)/);

  let baseAmount: number | undefined;
  if (croreMatch) {
    baseAmount = Number(croreMatch[1]) * 10000000;
  } else if (lakhMatch) {
    baseAmount = Number(lakhMatch[1]) * 100000;
  }

  // Check for explicit budget direction
  const aboveMatch = query.match(
    /(?:above|more than|at least|minimum|starts from|from)\s*(?:rs\.?|inr|₹)?\s*([\d,]+)/,
  );
  const belowMatch = query.match(
    /(?:under|below|less than|budget|around|upto|up to|max|maximum)\s*(?:rs\.?|inr|₹)?\s*([\d,]+)/,
  );

  const aboveAmount = aboveMatch
    ? Number(aboveMatch[1].replaceAll(",", ""))
    : undefined;
  const belowAmount = belowMatch
    ? Number(belowMatch[1].replaceAll(",", ""))
    : undefined;

  // Prioritize explicit "above" or "below", fall back to inferred from crore/lakh
  if (
    aboveAmount !== undefined &&
    !Number.isNaN(aboveAmount) &&
    aboveAmount > 0
  ) {
    return {
      amount: aboveAmount <= 200 ? aboveAmount * 100000 : aboveAmount,
      type: "above",
    };
  }
  if (
    belowAmount !== undefined &&
    !Number.isNaN(belowAmount) &&
    belowAmount > 0
  ) {
    return {
      amount: belowAmount <= 200 ? belowAmount * 100000 : belowAmount,
      type: "under",
    };
  }
  if (baseAmount) {
    return { amount: baseAmount, type: "under" };
  }

  return {};
}

function parseIntent(query: string): SearchIntent {
  const type = checkQueryFor(query, [
    { text: "suv", value: "SUV" },
    { text: "sedan", value: "Sedan" },
    { text: "hatchback", value: "Hatchback" },
    { text: "hatch back", value: "Hatchback" },
  ]);

  const transmission = checkQueryFor(query, [
    { text: "automatic", value: "Automatic" },
    { text: "manual", value: "Manual" },
  ]);

  const useCase = checkQueryFor(query, [
    { text: "highway", value: "highway" },
    { text: "city", value: "city" },
  ]);

  // Enhanced family size detection
  const familyMatch = query.match(
    /(\d+)\s*(people|person|members|seater|member|adult|persons)/,
  );
  const familySize = familyMatch ? Number(familyMatch[1]) : undefined;

  const budgetParsed = parseBudget(query);

  return {
    budget: budgetParsed.amount,
    budgetType: budgetParsed.type,
    type: type as CarType | undefined,
    wantsMileage:
      query.includes("mileage") ||
      query.includes("fuel efficient") ||
      query.includes("fuel economy"),
    wantsSafety: query.includes("safety") || query.includes("safe"),
    wantsFamily:
      query.includes("family") ||
      query.includes("7 seater") ||
      query.includes("seven seater") ||
      query.includes("spacious"),
    wantsEV:
      query.includes(" ev") ||
      query.includes("electric") ||
      query.includes("battery"),
    transmission: transmission as Transmission | undefined,
    useCase: useCase as "city" | "highway" | undefined,
    familySize,
  };
}

function filterCars(car: Car, intent: SearchIntent): boolean {
  // Budget filtering with support for both under and above
  if (intent.budget) {
    if (intent.budgetType === "above" && car.price < intent.budget)
      return false;
    if (intent.budgetType === "under" && car.price > intent.budget)
      return false;
    if (!intent.budgetType && car.price > intent.budget) return false;
  }

  // Avoid conflicting car type and fuel type combinations
  if (intent.type && car.type !== intent.type) return false;
  if (intent.wantsEV && car.fuelType !== "EV") return false;
  if (intent.transmission && car.transmission !== intent.transmission)
    return false;

  // Use case filtering
  if (intent.useCase === "city" && !car.cityUse) return false;
  if (intent.useCase === "highway" && !car.highwayUse) return false;

  // Family size sanity check - avoid obviously wrong matches
  if (intent.familySize) {
    if (intent.familySize <= 4 && car.seatingCapacity >= 7) return false;
    if (intent.familySize > 4 && car.seatingCapacity <= 5) return false;
  }

  return true;
}

function calculateFamilyScore(
  car: Car,
  familySize: number | undefined,
): number {
  let score = 0;

  if (familySize && familySize <= 4) {
    // Small families (2-4 people): prefer 4-5 seaters
    if (car.seatingCapacity === 4 || car.seatingCapacity === 5) {
      score += 30;
    } else if (car.seatingCapacity >= 7) {
      score -= 20;
    } else {
      score += 8;
    }
  } else if (familySize && familySize > 4) {
    // Larger families (5+ people): prefer 7 seaters
    if (car.seatingCapacity >= 7) {
      score += 30;
    } else if (car.seatingCapacity <= 5) {
      score -= 15;
    } else {
      score += 8;
    }
  } else {
    // wantsFamily but no specific family size: general family preference
    if (car.seatingCapacity >= 5) {
      score += 15;
    }
  }

  return score;
}

function scoreCar(car: Car, intent: SearchIntent): number {
  let score = 0;

  // Budget scoring with bidirectional support
  if (intent.budget) {
    if (intent.budgetType === "above") {
      // Higher price is better for "above" budget queries
      const priceAbove = car.price - intent.budget;
      score += Math.max(0, Math.min(30, (priceAbove / intent.budget) * 30));
    } else {
      // Under/max budget: penalize if over budget, reward staying under
      const budgetLeft = intent.budget - car.price;
      score += Math.max(0, 30 - (budgetLeft / intent.budget) * 20);
    }
  }

  // Type, EV, and transmission matching
  score = addScoreIf(intent.type === car.type, 20, score);
  score = addScoreIf(intent.wantsEV && car.fuelType === "EV", 25, score);
  score = addScoreIf(intent.transmission === car.transmission, 15, score);

  // Use case scoring
  score = addScoreIf(intent.useCase === "city" && car.cityUse, 12, score);
  score = addScoreIf(intent.useCase === "highway" && car.highwayUse, 12, score);

  // Safety scoring
  score += intent.wantsSafety ? car.safety * 6 : car.safety * 2;

  // Mileage scoring
  if (intent.wantsMileage && car.fuelType !== "EV") {
    score += Math.min(car.mileage, 30);
  } else if (intent.wantsMileage && car.fuelType === "EV") {
    score += 18;
  }

  // Family scoring
  if (intent.wantsFamily) {
    score += calculateFamilyScore(car, intent.familySize);
    score += Math.min(car.bootSpace / 40, 15);
  }

  return Number(score.toFixed(1));
}

function getRecommendationReason(car: Car, intent: SearchIntent): string {
  const reasons: string[] = [];

  if (intent.budget) {
    reasons.push(`fits your budget at Rs ${car.price.toLocaleString("en-IN")}`);
  }

  if (intent.type === car.type) {
    reasons.push(`matches your ${car.type} preference`);
  }

  if (intent.wantsEV && car.fuelType === "EV") {
    reasons.push("matches your EV preference");
  }

  if (intent.transmission === car.transmission) {
    reasons.push(`has ${car.transmission.toLowerCase()} transmission`);
  }

  if (intent.wantsSafety && car.safety >= 4) {
    reasons.push(`has a strong ${car.safety}-star safety rating`);
  }

  if (intent.wantsMileage && car.fuelType !== "EV") {
    reasons.push(`offers ${car.mileage} km/l mileage`);
  }

  if (intent.wantsFamily && car.seatingCapacity >= 7) {
    reasons.push(`has ${car.seatingCapacity} seats for family use`);
  }

  if (intent.useCase === "city" && car.cityUse) {
    reasons.push("works well for city driving");
  }

  if (intent.useCase === "highway" && car.highwayUse) {
    reasons.push("works well for highway driving");
  }

  if (reasons.length === 0) {
    return "Balanced match based on price, safety, mileage, and everyday usability.";
  }

  return reasons.slice(0, 3).join(", ") + ".";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecommendBody;
    const query = getQueryText(body);

    if (!query.trim()) {
      return Response.json(
        { error: "Please send a query, prompt, or queries array." },
        { status: 400 },
      );
    }

    const intent = parseIntent(query);
    const recommendations = cars
      .filter((car) => filterCars(car, intent))
      .map((car) => ({
        ...car,
        reason: getRecommendationReason(car, intent),
        score: scoreCar(car, intent),
      }))
      .sort((a, b) => b.score - a.score || a.price - b.price)
      .slice(0, 5);

    return Response.json({
      query,
      parsed: intent,
      count: recommendations.length,
      recommendations,
    });
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
}
