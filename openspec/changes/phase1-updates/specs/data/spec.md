# Spec: CSV Data Support

## ADDED Requirements

### Requirement: CSV Import Support
The system MUST support loading task data from CSV format.

#### Scenario: Parse CSV Data
- GIVEN a CSV string with columns `id,title,status,assignee`
- WHEN the application parses this data
- THEN it correctly maps to the internal Task objects.

### Requirement: CSV Export Support
The system MUST support exporting current task data to CSV format.

#### Scenario: Export Tasks
- GIVEN a list of tasks
- WHEN I trigger the export function
- THEN I receive a CSV file containing all task details.
