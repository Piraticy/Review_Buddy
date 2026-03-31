# Review Buddy

Review Buddy is a responsive after-school learning app for kids and teens.
It supports country-aware onboarding, age-level learning paths, learner and admin roles, and a live frontend register/sign-in flow.

Current version: `1.5.0`

Production URL: `https://review-buddy-gray.vercel.app`

## What the app includes

- Live learner registration and sign-in
- Default admin login with username `Admin` and password `admin`
- Country-aware subject mapping, continent/capital context, and theme styling
- Kindergarten, primary, and teen learning flows
- Dynamic quiz generation so each session feels different
- Full-screen quiz page with one-card-at-a-time questions
- Kindergarten colouring, alphabet, numbers, picture puzzle, and spoken prompt support
- Installable app support with manifest, offline shell, and automatic install prompt handling
- Solo and group quiz modes
- Free, Trial, and Elite plan choices with no charging step during live testing
- 15-question Free quizzes for primary and teen learners, with longer Elite practice sets
- Subject pages with country-aware learning notes, quick quiz, and full exam choices
- Elite-only review pages that show learner answers against the correct answers
- Score tracking and subject leaderboards
- Elite certificate generation with logo, pass level, grade, and owner signature
- Softer learner-facing wording and a shorter, cleaner admin dashboard
- Admin subpages for countries, staff, registered learners, follow-up queues, and reports
- Responsive design for mobile, tablet, and desktop

## Roles

### Student

- Register with name, email, password, country, level, and plan
- Take quizzes or exams with changing multiple-choice questions
- Enter a subject page first, then choose learning notes, a quiz, or a full exam
- View scores and leaderboard placement
- Elite learners can review their answers on a dedicated review page
- Unlock achievement certificates on Elite after a passing score
- Use group mode for team discussion practice

### Admin

- Sign in with the default admin account
- View live learner activity and support status
- Track countries, registered learners, follow-ups, and weekly activity
- Manage staff entries directly in the admin dashboard
- Open deeper admin pages without keeping the overview screen too long

## Access plans

- Free: shorter daily practice
- Trial: longer practice flow
- Elite: full review page and certificate tools

All plans are open during live testing, so learners can choose any plan without a payment step.

## Tech stack

- React
- TypeScript
- Vite
- Plain CSS
- Vercel for live deployment

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

- Live production URL: `https://review-buddy-gray.vercel.app`
- Vercel command after login: `npx vercel --prod`
- Vercel login command: `npx vercel login`

## Current live-data note

Learner registration and admin records are currently stored in the browser for this frontend build.
That means new learner accounts appear in the admin pages on the same browser/device unless a backend is added later.

## Product message

Learn, practise, and grow after school.
