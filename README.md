# Review Buddy

Review Buddy is a responsive after-school learning app for kids and teens.
It supports country-aware onboarding, age-level learning paths, student and admin roles, and quiz access based on Free, Elite Trial, or Elite plans.

Current version: `1.2.0`

## What the app includes

- Student login and quick sample accounts
- Admin login UI with a view-first control dashboard
- Country-aware subject mapping, continent/capital context, and theme styling
- Kindergarten, primary, and teen learning flows
- Dynamic quiz generation so each session feels different
- Full-screen quiz page with one-card-at-a-time questions
- Kindergarten colouring, alphabet, numbers, picture puzzle, and spoken prompt support
- Installable app support with manifest, offline shell, and automatic install prompt handling
- Solo and group quiz modes
- Free, 5-day Elite Trial, and Elite access rules
- Score tracking and subject leaderboards
- Softer learner-facing wording and a more family-friendly admin dashboard
- Responsive design for mobile, tablet, and desktop

## Roles

### Student

- Choose country, learning stage, level, mode, and subject
- Take quizzes or exams with changing multiple-choice questions
- Enter a full-screen quiz flow after choosing a subject
- View scores and leaderboard placement
- Use group mode for team discussion practice

### Admin

- View live learner activity and support status
- Track trials, family follow-ups, and weekly growth
- Review leaderboards, popular subjects, and plan usage
- Keep a simple oversight screen without editing learner answers

## Access plans

- Free: limited questions, fewer subjects, scores, and leaderboard view
- Elite Trial: full access for 5 days
- Elite: full subject library, deeper feedback, and richer review flow

## Tech stack

- React
- TypeScript
- Vite
- Plain CSS
- GitHub Pages for free deployment

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Free deployment

Review Buddy is configured for GitHub Pages deployment through GitHub Actions.
GitHub Pages is free for public repositories, although GitHub account restrictions can still block Actions from running.

- Workflow file: `.github/workflows/deploy.yml`
- Expected deployment URL: `https://piraticy.github.io/Review_Buddy/`

## Product message

Learn, practise, and grow after school.
