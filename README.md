# Review Buddy

Review Buddy is a responsive after-school learning app for kids and teens.
It supports country-aware onboarding, age-level learning paths, learner and admin roles, a cleaner public-facing register/sign-in flow, and a shared backend-ready data layer.

Current version: `1.8.9`

Production URL: `https://review-buddy-gray.vercel.app`

Curriculum-aware notes are now shaped around country-specific curriculum direction and official education bodies. Current reference bodies used to structure the notes engine include:

- Kenya Institute of Curriculum Development (CBC): `https://kicd.ac.ke/`
- Tanzania Institute of Education: `https://tie.go.tz/`
- Uganda National Curriculum Development Centre: `https://www.ncdc.go.ug/`
- Ghana National Council for Curriculum and Assessment: `https://nacca.gov.gh/`
- South Africa CAPS curriculum pages: `https://www.education.gov.za/Curriculum/CurriculumAssessmentPolicyStatements(CAPS).aspx`
- National Curriculum for England: `https://www.gov.uk/government/collections/national-curriculum`
- NCERT textbooks and curriculum support: `https://ncert.nic.in/textbook.php`

## What the app includes

- Live learner registration and sign-in
- Default admin login with username `Admin` and password `admin`
- Avatar choice with generated icons or an uploaded picture during sign-up
- Boy/girl selection to personalise the learner profile
- More country coverage across Africa, including Kenya, Tanzania, Uganda, Rwanda, Nigeria, Ghana, South Africa, Zambia, Malawi, Ethiopia, and Botswana
- Country-aware subject mapping, continent/capital context, and theme styling
- Kindergarten, primary, and teen learning flows
- Dynamic quiz generation so each session feels different
- Full-screen quiz page with one-card-at-a-time questions
- Kindergarten colouring, alphabet, numbers, picture puzzle, and spoken prompt support
- Installable app support with manifest, offline shell, and automatic install prompt handling
- Solo and group quiz modes
- Free, Trial, and Elite plan choices with no payment step in the current build
- 15-question Free quizzes for primary and teen learners, with longer Elite practice sets
- Subject pages with country-aware learning notes, quick quiz, and full exam choices
- Elite-only review pages that show learner answers against the correct answers
- Score tracking and subject leaderboards
- Elite certificate generation with logo, pass level, grade, and owner signature
- Softer learner-facing wording and a shorter, cleaner admin dashboard
- Admin subpages for countries, staff, registered learners, follow-up queues, and reports
- Shared backend-ready repository layer for learner accounts and staff data
- Responsive design for mobile, tablet, and desktop

## Roles

### Student

- Register with name, email, gender, avatar choice, country, level, and plan
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

All plans can currently be chosen without a payment step.

## Tech stack

- React
- TypeScript
- Vite
- Plain CSS
- Supabase-ready shared backend and database layer
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

## Backend setup

This repo now includes:

- [src/lib/supabase.ts](/Users/adamrobertmwakisyala/Desktop/Devs/Review_Buddy/src/lib/supabase.ts)
- [src/lib/repository.ts](/Users/adamrobertmwakisyala/Desktop/Devs/Review_Buddy/src/lib/repository.ts)
- [supabase/schema.sql](/Users/adamrobertmwakisyala/Desktop/Devs/Review_Buddy/supabase/schema.sql)
- [.env.example](/Users/adamrobertmwakisyala/Desktop/Devs/Review_Buddy/.env.example)

To enable the shared backend:

1. Create a Supabase project.
2. Run the SQL in [supabase/schema.sql](/Users/adamrobertmwakisyala/Desktop/Devs/Review_Buddy/supabase/schema.sql).
3. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to your local `.env` and Vercel project environment variables.
4. In Supabase Auth settings, create the admin auth user for `admin@reviewbuddy.app` with password `admin`.
5. Redeploy the app.

## Current data note

If Supabase environment variables are not set yet, the app automatically falls back to browser storage so it keeps working.
Once Supabase is configured, learner registrations and staff updates can be shared across devices.

## Product message

Learn, practise, and grow after school.
