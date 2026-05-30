"use client";

import { FormEvent, useState } from "react";

const promptChips = [
  "Safe SUV under 15 lakh",
  "Best mileage city car",
  "Family car for 4 people",
  "Automatic Car for highway driving",
  "Budget EV for city use",
];

type Recommendation = {
  id: number;
  name: string;
  brand: string;
  price: number;
  mileage: number;
  safety: number;
  reason: string;
  score: number;
};

type RecommendResponse = {
  recommendations?: Recommendation[];
  error?: string;
};

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function Home() {
  const [query, setQuery] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!query.trim()) {
      setError("Please describe what kind of car you want.");
      setRecommendations([]);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = (await response.json()) as RecommendResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Could not find recommendations.");
      }

      setRecommendations(data.recommendations ?? []);
    } catch (caughtError) {
      setRecommendations([]);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setQuery("");
    setRecommendations([]);
    setError("");
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-3xl flex-col items-center justify-center text-center">
        <div className="mb-10">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            AI Car Matchmaker
          </h1>
          <p className="mt-4 text-base text-zinc-400 sm:text-lg">
            Describe your needs and get the best car recommendations tailored
            just for you.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {promptChips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setQuery(chip)}
              className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              {chip}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-48 w-full resize-none rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-4 focus:ring-zinc-800/60"
            placeholder="Example: I need a safe SUV under 15 lakh for family city driving ..."
          />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-500 disabled:text-zinc-900"
            >
              {isLoading ? "Finding..." : "Find My Car"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full border border-zinc-800 px-8 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-950"
            >
              Clear
            </button>
          </div>

          {error ? <p className="mt-5 text-sm text-red-400">{error}</p> : null}
        </form>

        {recommendations.length > 0 ? (
          <div className="mt-10 grid w-full gap-4 text-left">
            {recommendations.map((car) => (
              <article
                key={car.id}
                className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {car.name}
                    </h2>
                    <p className="text-sm text-zinc-400">{car.brand}</p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-200">
                    Score: {car.score}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-zinc-300 sm:grid-cols-3">
                  <p>
                    <span className="text-zinc-500">Price:</span>{" "}
                    {priceFormatter.format(car.price)}
                  </p>
                  <p>
                    <span className="text-zinc-500">Mileage:</span>{" "}
                    {car.mileage === 0 ? "EV" : `${car.mileage} km/l`}
                  </p>
                  <p>
                    <span className="text-zinc-500">Safety:</span>{" "}
                    {car.safety} star
                  </p>
                </div>

                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  {car.reason}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
