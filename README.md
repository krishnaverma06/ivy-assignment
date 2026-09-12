# Ivy Homes Software Engineering Internship Assignment

This repository contains my submission for the Ivy Homes Software Engineering Internship assignment.

## Project Structure
- `submission.json`: The final JSON document containing all 10 answers and the detailed API discrepancies.
- `ivy-frontend/`: A complete, modern Single Page Application built with React, Vite, and Vanilla CSS. It successfully circumvents all API bugs to present the data correctly.

## How to run the application

1. Open a terminal and navigate to the `ivy-frontend` directory:
   ```bash
   cd ivy-frontend
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173` to view the application. You can log in using `demo1@ivy.homes` and password `12b9d8eb7b`.

## How I worked out what to distrust

I started by taking the "One piece of advice" at the bottom of the prompt to heart: *Pull the whole dataset down early.* 

When I attempted to hit `/auth/login`, I discovered the documentation claimed the `token` lived in a top-level key and lasted 24 hours, but inspecting the actual JSON payload revealed it was named `access_token` and expired in 15 minutes. 

While downloading the datasets, I noticed that `total` was returning `3343` listings, but querying page after page gave me identical, repeating items. This led me to systematically test the pagination logic. By manually altering limits and testing `page` vs `offset` endpoints, I uncovered that `page` was completely ignored, `offset` was heavily relied upon, and `limit` was hard-capped at 50 rather than 200.

I discovered the hidden `dataset_audit_ref` token and the fake listing contacts by treating the problem as a data analysis exercise rather than just API integration. Grouping by contacts and sorting area/price metrics quickly brought the fake accounts and corrupt metrics (like an apartment with 47 sqm area) to light.

To handle these untrustworthy endpoints on the frontend, I implemented client-side pagination, client-side sorting, and client-side filtering where the API endpoints completely failed to filter correctly (e.g. `furnishing`). I also correctly multiplied project prices by 1 Crore since they were documented as Rupees but returned in Crores.

## What I checked that turned out to be fine

Not all hypotheses panned out. I rigorously tested several assumptions that proved the API was behaving *correctly* in those areas:
1. **Uniqueness of `listing_id`**: I suspected that duplicate listings might share the same `listing_id` when pagination wrapped around. However, analyzing the full dataset proved that the `listing_id` is genuinely 100% unique for every single return value. 
2. **Duplicate Properties by exact Coordinates/Floor**: I assumed that fake or duplicate properties might have exactly the same `latitude`, `longitude`, and `floor`. Grouping the dataset by these exact metrics returned zero duplicates—meaning duplicate properties and fake listings actually use slightly jittered coordinates or different floors.
3. **URL and Contact sharing**: I expected fake listings to reuse the same `listing_url` as real ones, but this turned out to be false. The `listing_url`s were completely distinct. Fake listings were instead identifiable by the exact same phone contact using multiple distinct agent/agency names.

## What I would do with another two days

If I had two more days to expand this project, I would focus on:
1. **Backend Proxy Server**: Instead of having the React frontend connect directly to the Ivy Homes API and manually fixing token refreshes and data filters client-side, I would build an Express/Node.js proxy layer. This backend would cache responses, handle the 15-minute token rotation seamlessly, normalize the units (converting Crores to Rupees on the fly), and expose clean, bug-free GraphQL or REST endpoints for the frontend.
2. **Advanced Deduplication Algorithm**: The current data has properties with slightly jittered lat/lon coordinates. I would write a clustering algorithm (like DBSCAN) combined with Levenshtein distance on apartment names to programmatically group properties that are duplicates despite their intentionally jittered metrics.
3. **Robust Visualization for Insights**: I would use a library like Recharts or Chart.js to build a much more comprehensive Insights Dashboard in the React app, displaying average price per square foot across different localities dynamically.

---
*Developed by Krishna Verma with the assistance of LLM tooling (Gemini).*
