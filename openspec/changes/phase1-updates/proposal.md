# Phase 1: Name-based Login & CSV Support

## Summary
Update the current system to use name-based simulation for login and add support for CSV format in data import/export.

## Motivation
- Simplify the login process for the current phase (simulation only).
- Enhance data interoperability by supporting CSV, which is easier for users to manage than JSON.

## Solution Overview
- **Authentication**: Modify the login page to accept a "Name" instead of email/password. This name will be used to identify the current session user.
- **Data Handling**: 
  - Update `data-parser.ts` to support parsing CSV strings into the Task structure.
  - Allow exporting current task status as CSV.
