# Spec: Practice Mode

## ADDED Requirements

### Requirement: Practice Route
The Quest Player application SHALL provide a `/practice` route that allows users to configure and start practice sessions.

#### Scenario: User accesses practice mode
- **GIVEN** a user is on the Quest Player application
- **WHEN** the user navigates to `/practice`
- **THEN** the Practice Configuration UI SHALL be displayed with topic selection, difficulty settings, and start button

---

### Requirement: Topic Selection
The Practice Configuration UI SHALL allow users to select one or more concept categories for practice.

#### Scenario: User selects multiple topics
- **GIVEN** the user is on the Practice Configuration UI
- **WHEN** the user enables the "Loop" and "Conditional" topic checkboxes
- **THEN** both topics SHALL be marked as selected and visible in the configuration summary

---

### Requirement: Question Count Configuration
For each enabled topic, the system SHALL allow users to configure the number of questions (1-10).

#### Scenario: User adjusts question count
- **GIVEN** the "Loop" topic is enabled
- **WHEN** the user sets the question count to 5
- **THEN** the session SHALL include 5 loop-related exercises

---

### Requirement: Difficulty Selection
For each enabled topic, the system SHALL provide a difficulty selector with 5 levels.

#### Scenario: User selects difficulty level
- **GIVEN** the "Loop" topic is enabled
- **WHEN** the user selects "Khó" (Hard) difficulty
- **THEN** the generated exercises SHALL have difficulty values between 7-8

| Difficulty Level | Difficulty Range |
|-----------------|------------------|
| Rất dễ | 1-2 |
| Dễ | 3-4 |
| Trung bình | 5-6 |
| Khó | 7-8 |
| Rất khó | 9-10 |

---

### Requirement: Random Challenge Mode
The system SHALL provide a "Thách thức tôi" button that generates a random session.

#### Scenario: User clicks random challenge
- **GIVEN** the user is on the Practice Configuration UI
- **WHEN** the user clicks "Thách thức tôi"
- **THEN** the system SHALL generate a session with randomly selected topics and difficulties

---

### Requirement: Firebase Authentication
The Quest Player SHALL support user authentication via Firebase.

#### Scenario: User signs in with Google
- **GIVEN** the user is not signed in
- **WHEN** the user clicks "Sign in with Google"
- **THEN** the user SHALL be authenticated and their profile displayed

#### Scenario: User signs in with Email/Password
- **GIVEN** the user is not signed in
- **WHEN** the user enters valid email and password
- **THEN** the user SHALL be authenticated

---

### Requirement: Session Persistence
Practice sessions SHALL be persisted locally to allow resumption after page refresh.

#### Scenario: User refreshes page mid-session
- **GIVEN** the user has completed 2 of 5 exercises in a session
- **WHEN** the user refreshes the page
- **THEN** the system SHALL prompt to resume the incomplete session

---

### Requirement: Scoring System
The system SHALL track XP and level progression per concept category.

#### Scenario: User completes an exercise
- **GIVEN** the user completes a difficulty-5 exercise in 20 seconds without hints
- **WHEN** the exercise is marked complete
- **THEN** the user SHALL receive XP based on the scoring formula

---

### Requirement: Template Registry
The application SHALL load templates from a shared template package.

#### Scenario: Templates load on startup
- **GIVEN** the application starts
- **WHEN** template initialization completes
- **THEN** bundled templates SHALL be available for exercise generation

#### Scenario: Remote templates override local
- **GIVEN** a remote template has a higher version than the local copy
- **WHEN** templates are fetched from Firebase
- **THEN** the remote version SHALL override the local version

---

### Requirement: Progress Sync
User progress SHALL be synchronized to Firebase Firestore.

#### Scenario: Progress syncs after exercise
- **GIVEN** the user is authenticated
- **WHEN** an exercise is completed
- **THEN** the updated XP and level SHALL be synced to Firestore
