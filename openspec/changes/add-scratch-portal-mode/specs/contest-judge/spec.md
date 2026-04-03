# contest-judge API Delta

## ADDED Requirements

### Requirement: Submission History Endpoint (Phase 1)
The system SHALL expose `GET /api/submit/history/:quest_id` authenticated by Supabase JWT.

#### Scenario: Returns recent submissions for authenticated user
- **WHEN** an authenticated participant calls `GET /api/submit/history/scratch-1`
- **THEN** the API returns the 20 most recent submissions for the given quest by that user, each entry containing: `id`, `score`, `status`, `created_at`, `worker_log` (summary only — pass/fail per TC, no raw output)

#### Scenario: Unauthorized access
- **WHEN** the request lacks a valid `Authorization: Bearer <jwt>` header
- **THEN** the API returns `401 Unauthorized`

---

### Requirement: Problems Metadata Endpoint (Phase 1)
The system SHALL implement `GET /api/problems/:id` returning problem definition with public test cases only.

#### Scenario: Returns problem with sample test_cases only
- **WHEN** a participant fetches `GET /api/problems/scratch-1`
- **THEN** the API returns the problem metadata and only test_cases where `is_sample === true` (private test cases are excluded)

#### Scenario: Problem not found
- **WHEN** the `:id` does not match any known problem
- **THEN** the API returns `404 Not Found` with `{ error: 'Problem not found' }`

---

### Requirement: Public Leaderboard Endpoint (Phase 2)
The system SHALL expose `GET /api/leaderboard/:problem_id` without authentication requirement.

#### Scenario: Returns top-50 participants
- **WHEN** anyone calls `GET /api/leaderboard/scratch-1` (no auth required)
- **THEN** the API returns an array of at most 50 entries ordered by `best_score DESC`, each containing: `rank`, `display_name`, `best_score`, `submission_count`, `best_time`

#### Scenario: Rate limiting
- **WHEN** a single IP exceeds 30 requests per minute
- **THEN** the API returns `429 Too Many Requests`

---

### Requirement: TurboWarp Extension Endpoint (Phase 3)
The system SHALL serve the TurboWarp contest extension file.

#### Scenario: Extension file served as JavaScript
- **WHEN** a browser requests `GET /ext/contest-v2.js`
- **THEN** the server returns the file with `Content-Type: text/javascript` and `Cache-Control: max-age=3600`
