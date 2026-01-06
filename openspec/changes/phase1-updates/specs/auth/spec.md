# Spec: Name-based Authentication

## MODIFIED Requirements

### Requirement: Login with Name
The system MUST allow users to log in using only their name.

#### Scenario: Successful Login
- GIVEN I am on the Login page
- WHEN I enter a valid name (e.g., "Alice")
- AND I click "Enter"
- THEN I am redirected to the Home page
- AND my session is identified as "Alice".
