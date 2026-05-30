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
  type?: CarType;
  wantsMileage: boolean;
  wantsSafety: boolean;
  wantsFamily: boolean;
  wantsEV: boolean;
  transmission?: Transmission;
  useCase?: "city" | "highway";
};

const cars = carsData as Car[];

function getQueryText(body: RecommendBody): string {
  const parts = [
    body.query,
    body.prompt,
    ...(Array.isArray(body.queries) ? body.queries : []),
  ];

  return parts.filter(Boolean).join(" ").toLowerCase();
}

function parseBudget(query: string): number | undefined {
  const croreMatch = query.match(/(\d+(?:\.\d+)?)\s*(cr|crore|crores)/);
  if (croreMatch) {
    return Number(croreMatch[1]) * 10000000;
  }

  const lakhMatch = query.match(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|l)/);
  if (lakhMatch) {
    return Number(lakhMatch[1]) * 100000;
  }

  const budgetMatch = query.match(
    /(?:under|below|less than|budget|around|upto|up to)\s*(?:rs\.?|inr|₹)?\s*([\d,]+)/,
  );

  if (!budgetMatch) {
    return undefined;
  }

  const amount = Number(budgetMatch[1].replaceAll(",", ""));

  if (Number.isNaN(amount)) {
    return undefined;
  }

  return amount <= 200 ? amount * 100000 : amount;
}

function parseIntent(query: string): SearchIntent {
  const type = query.includes("suv")
    ? "SUV"
    : query.includes("sedan")
      ? "Sedan"
      : query.includes("hatchback") || query.includes("hatch back")
        ? "Hatchback"
        : undefined;

  const transmission = query.includes("automatic")
    ? "Automatic"
    : query.includes("manual")
      ? "Manual"
      : undefined;

  const useCase = query.includes("highway")
    ? "highway"
    : query.includes("city")
      ? "city"
      : undefined;

  return {
    budget: parseBudget(query),
    type,
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
    transmission,
    useCase,
  };
}

function filterCars(car: Car, intent: SearchIntent): boolean {
  if (intent.budget && car.price > intent.budget) {
    return false;
  }

  if (intent.type && car.type !== intent.type) {
    return false;
  }

  if (intent.wantsEV && car.fuelType !== "EV") {
    return false;
  }

  if (intent.transmission && car.transmission !== intent.transmission) {
    return false;
  }

  if (intent.useCase === "city" && !car.cityUse) {
    return false;
  }

  if (intent.useCase === "highway" && !car.highwayUse) {
    return false;
  }

  return true;
}

function scoreCar(car: Car, intent: SearchIntent): number {
  let score = 0;

  if (intent.budget) {
    const budgetLeft = intent.budget - car.price;
    score += Math.max(0, 30 - (budgetLeft / intent.budget) * 20);
  }

  if (intent.type === car.type) {
    score += 20;
  }

  if (intent.wantsEV && car.fuelType === "EV") {
    score += 25;
  }

  if (intent.transmission === car.transmission) {
    score += 15;
  }

  if (intent.useCase === "city" && car.cityUse) {
    score += 12;
  }

  if (intent.useCase === "highway" && car.highwayUse) {
    score += 12;
  }

  if (intent.wantsSafety) {
    score += car.safety * 6;
  } else {
    score += car.safety * 2;
  }

  if (intent.wantsMileage && car.fuelType !== "EV") {
    score += Math.min(car.mileage, 30);
  }

  if (intent.wantsMileage && car.fuelType === "EV") {
    score += 18;
  }

  if (intent.wantsFamily) {
    score += car.seatingCapacity >= 7 ? 25 : 8;
    score += Math.min(car.bootSpace / 40, 15);
  }

  return Math.round(score * 100) / 100;
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
