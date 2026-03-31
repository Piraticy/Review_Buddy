# Review Buddy

Review Buddy is a responsive after-school learning app for kids and teens.
It supports country-aware onboarding, age-level learning paths, student and admin roles, and quiz access based on Free, Elite Trial, or Elite plans.

Current version: `1.4.1`

Production URL: `https://review-buddy-gray.vercel.app`

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
- 15-question Free quizzes for primary and teen learners, with longer Elite practice sets
- Subject pages with learning notes, quick quiz, and full exam choices
- Elite-only review pages that show learner answers against the correct answers
- Score tracking and subject leaderboards
- Elite certificate generation with logo, pass level, grade, and owner signature
- Softer learner-facing wording and a shorter, cleaner admin dashboard
- Admin subpages for countries, staff, follow-up queues, and reports
- Responsive design for mobile, tablet, and desktop

## Roles

### Student

- Choose country, learning stage, level, mode, and subject
- Take quizzes or exams with changing multiple-choice questions
- Enter a subject page first, then choose learning notes, a quiz, or a full exam
- View scores and leaderboard placement
- Elite learners can review their answers on a dedicated review page
- Unlock achievement certificates on Elite after a passing score
- Use group mode for team discussion practice

### Admin

- View live learner activity and support status
- Track trials, family follow-ups, and weekly growth
- Review registered countries, leaderboards, popular subjects, plan usage, and staff assignments
- Open deeper admin pages without keeping the overview screen too long

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

The project is also prepared for Vercel deployment with `vercel.json`, which is a good free fallback when GitHub Pages is blocked.

- Current live Vercel URL: `https://review-buddy-gray.vercel.app`
- Workflow file: `.github/workflows/deploy.yml`
- Expected deployment URL: `https://piraticy.github.io/Review_Buddy/`
- Vercel command after login: `npx vercel --prod`
- Vercel login command: `npx vercel login`

## Product message

Learn, practise, and grow after school.
