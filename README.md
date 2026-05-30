# AI Car Matchmaker

An intelligent car recommendation system that analyzes user preferences and recommends the best matching vehicles from a curated database.

## Project Overview

**AI Car Matchmaker** is a recommendation engine that uses natural language processing to understand user requirements and intelligently rank cars based on multiple criteria:

- **Budget constraints** - Parses Indian currency formats (crores, lakhs)
- **Vehicle preferences** - Type (SUV, Sedan, Hatchback), transmission, fuel type
- **Family needs** - Family size-specific seating optimization
- **Use case** - City or highway suitability
- **Priorities** - Safety, mileage, or spaciousness

The system returns top 5 matched vehicles with personalized recommendations and scoring explanations.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **Language**: TypeScript
- **Styling**: CSS & Tailwind CSS (PostCSS)
- **Data**: JSON-based car database
- **Linting**: ESLint

## Setup Steps

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm/bun

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ai-car-matchmaker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run development server**

   ```bash
   npm run dev
   ```

   Opens at [http://localhost:3000](http://localhost:3000)

4. **Build for production**
   ```bash
   npm run build
   npm run start
   ```

## Recommendation Logic

The scoring algorithm evaluates each car across multiple dimensions:

### Budget Scoring (0-30 points)

- Rewards cars within budget range
- Diminishes score if car exceeds budget

### Feature Matching (Points vary)

- **Type match**: +20 pts (SUV, Sedan, Hatchback)
- **EV preference**: +25 pts
- **Transmission**: +15 pts
- **Use case**: +12 pts (city/highway suitability)

### Safety & Efficiency

- **Safety**: 6x multiplier if prioritized, 2x otherwise
- **Mileage**: Up to 30 pts for fuel efficiency
- **EV mileage**: +18 pts if electric

### Family-Focused Scoring

- **Small families (2-4 people)**
  - 4-5 seaters: +30 pts ✓
  - 7+ seaters: -20 pts (penalized)
- **Larger families (5+ people)**
  - 7+ seaters: +30 pts ✓
  - 4-5 seaters: -15 pts (penalized)
- **Boot space**: Up to 15 pts bonus

### Final Ranking

Cars are sorted by score (descending) and price (ascending), returning top 5 matches.

## API Endpoint

**POST** `/api/recommend`

### Request Body

```json
{
  "query": "I need a safe SUV under 20 lakhs for my family of 4",
  "prompt": "optional additional context",
  "queries": ["alternative query strings"]
}
```

### Response

```json
{
  "query": "parsed query text",
  "parsed": { "budget": 2000000, "type": "SUV", "familySize": 4, ... },
  "count": 5,
  "recommendations": [
    {
      "id": 1,
      "name": "Model Name",
      "brand": "Brand",
      "price": 1800000,
      "score": 85.5,
      "reason": "matches your family needs..."
    }
  ]
}
```

## Deployment

### Deploy on Vercel (Recommended)

Vercel is optimized for Next.js:

1. Push code to GitHub/GitLab
2. Connect to [Vercel](https://vercel.com)
3. Auto-deploys on push to main branch

### Deploy on Other Platforms

**Docker**

```bash
docker build -t ai-car-matchmaker .
docker run -p 3000:3000 ai-car-matchmaker
```

**Traditional Hosting**

```bash
npm run build
npm run start
```

Runs on port 3000 by default. Set `PORT` environment variable to change.

### Environment Variables

- `NODE_ENV`: Set to `production` for builds
- `PORT`: Default 3000 (for non-Vercel hosting)

## Project Structure

```
app/
├── api/recommend/route.ts    # Main recommendation API
├── page.tsx                  # Home page
├── layout.tsx                # Root layout
└── data/cars.json            # Car database
public/                       # Static assets
postcss.config.mjs            # PostCSS config
tailwind.config.ts            # Tailwind CSS config (if using)
next.config.ts                # Next.js configuration
```

## License

MIT
