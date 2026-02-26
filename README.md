# [Measy](measy.codemonkapps.me)

Measy is a full-stack meal prep planner for weekly planning, grocery rollups, and quick ordering links.

## Highlights
- Username/password authentication (create account + login).
- Authenticated app routes and APIs (except health + auth endpoints).
- Create and manage prep weeks with:
  - `start_date`
  - `days_count`
  - `meals_to_prep`
  - `people_count`
- Clone an existing week to a different start date.
- Prevent overlapping prep weeks on create/clone.
- Add meals with planned servings and full instruction text.
- Add/edit ingredients per meal (with paste + parse flow).
- Grocery rollup formula:
  - `quantity per serving x planned servings x number of people`
- Mark grocery items as ordered by clicking the row.
  - Ordered state is persisted in SQLite (not browser local storage).
- Calendar view:
  - Color-coded prep weeks
  - Click a day to switch to that day’s week
  - Past weeks are accessible via calendar day selection
- Quick order buttons per grocery item:
  - Blinkit
  - Zepto
  - Swiggy Instamart
  - Amazon Now

## Tech Stack
- Frontend: Vanilla JS, HTML, CSS
- Backend: Node.js, Express
- Database: SQLite (`better-sqlite3`)

## Local Development
1. Install dependencies:
```bash
npm install
```

2. Start the app:
```bash
npm start
```

3. Open:
```text
http://localhost:3000
```

## Data Storage
- Auth database (all users + sessions):
  - `data/user.db`
- Per-user planner database files:
  - `data/accounts/user_<id>.db`

## Docker Image
Use the steps below to build and run a Docker image for Measy.

1. Build the image (uses the committed `Dockerfile`):
```bash
docker build -t measy:latest .
```

2. Run the container:
```bash
docker run -d --name measy -p 3433:3433 -v "$(pwd)/data:/app/data" measy:latest
```

3. Open:
```text
http://localhost:3433
```

Notes:
- The volume mount `-v "$(pwd)/data:/app/data"` keeps SQLite data persistent on your host.
- Check running container:
```bash
docker ps
```
- View logs:
```bash
docker logs -f measy
```
- Stop container:
```bash
docker stop measy
```
- Remove container:
```bash
docker rm -f measy
```
