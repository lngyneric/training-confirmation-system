# Spec: Core Mini Program Features

## ADDED Requirements

### Requirement: Scaffold Mini Program Project
The system MUST include a new Taro project configured for React and TypeScript in the `miniprogram` directory.

#### Scenario: Project Structure
- GIVEN the repository root
- WHEN I check the `miniprogram` directory
- THEN I see a valid `package.json` and Taro project structure.

### Requirement: Task List View
The mini program MUST display the list of training tasks.

#### Scenario: View Tasks
- GIVEN I am on the home page of the mini program
- WHEN the page loads
- THEN I see a list of tasks with titles and status.

### Requirement: Task Confirmation
The mini program MUST allow users to confirm a task.

#### Scenario: Confirm Task
- GIVEN I am viewing a pending task
- WHEN I tap "Confirm"
- THEN the status changes to "Completed" (locally).
