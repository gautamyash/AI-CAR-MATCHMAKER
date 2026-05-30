const promptChips = [
  "Safe SUV under 15 lakh",
  "Best mileage city car",
  "Family car for 4 people",
  "Automatic Car for highway driving",
  "Budget EV for city use",
];

export default function Home() {
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
              className="rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="w-full">
          <textarea
            className="min-h-48 w-full resize-none rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-4 focus:ring-zinc-800/60"
            placeholder="Example: I need a safe SUV under 15 lakh for family city driving ..."
          />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Find My Car
            </button>
            <button
              type="button"
              className="rounded-full border border-zinc-800 px-8 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-950"
            >
              Clear
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
