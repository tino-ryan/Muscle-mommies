# Sprint 2 Bug Tracking

## Introduction
The ThriftFinder project began with the adoption of Notion as our primary bug tracking and task management tool. We chose Notion due to its familiarity, clean interface, and versatility, which allowed us to efficiently manage tasks alongside bug tracking. However, as the project evolved, we transitioned to Git Issues today, September 02, 2025, to leverage its integration with our development workflow, real-time collaboration features, and robust version control linkage. This shift aims to streamline issue resolution and enhance team coordination.

## Reasons for Using Notion
- **Familiarity**: The team was already accustomed to Notion, reducing the learning curve.
- **Clean and Easy to Use**: Its intuitive design facilitated quick adoption for bug tracking and task management.
- **Task Management**: Notion served as a centralized hub for organizing sprints, tasks, and bug reports.

## Pros and Cons of Notion
- **Pros**: User-friendly interface, customizable templates, and effective task management capabilities.
- **Cons**: Limited integration with code repositories, slower real-time updates, and less focus on development-specific workflows.

## Reasons for Switching to Git Issues
- **Integration with Development**: Seamless connection to our codebase for better issue tracking.
- **Real-Time Collaboration**: Enhanced team communication within the development environment.
- **Version Control Linkage**: Direct association with commits and pull requests for efficient bug fixes.

## Bug Table

| Bug Name                  | Priority     | Assignee | Reported By | Report Date | Closed Date | Description                              | Page         | Location   |
|---------------------------|--------------|----------|-------------|--------------|-------------|------------------------------------------|--------------|------------|
| Env variables tweaking    | High         | Tino     | Tino        | 19/08/2025   |  19/08/2025  | The login is failing because the Firebase values are wrong | Login/Sign-Up | Production |
| Update item stop working  | High         | Tino     | Aimee       | 25/08/2025   | 27/08/2025   | Update item functionality is unresponsive | Store Creation | Production |
| Items wasn't working      | Medium       | Laaiqah  | Mosey       | 28/08/2025   | 30/08/2025   | Items page fails to load any listings    | Item Detail   | Locally    |
| Firebase auth token mismatch | High      | Aimee    | Yuri        | 30/08/2025   | 01/09/2025   | Token mismatch causing login failures    | Authentication | Production |
| Map is not loading        | High         | Aimee    | Yuri        | 30/09/2025   | 30/09/2025   | The map for finding store is not loading when I run it on my side | Customer/Home | Locally    |
| sidebar chat overlap       | Medium       | Mosey    | Tino        | 01/08/2025   | 01/08/2025   | siderbar drawer overlaps with the chat page on the customers side | Cart Drawer | Production |
| Store profile not uploading | Medium       | Tino     | Mosey       | 01/09/2025   |  01/09/2025 | Name says it all                        | Store Creation | Locally    |
| Some filters not working  | Low          | Laaiqah  | Mosey       | 02/09/2025   |   02/09/2025  | Filters not working consistently         | Customer/Store | Locally    |
| Chat interface lag        | Medium       | Yuri     | Aimee       | 02/09/2025   |             | Chat messages are delayed during peak usage | Chat Interface | Locally    |

## Documentation Overview

This document outlines the bug tracking process for Sprint 2 of the ThriftFinder project, reflecting our transition from Notion to Git Issues. It includes a detailed table of bugs, their statuses, and resolution details, ensuring a comprehensive approach to issue management.

- **Bug Identification**: Bugs were reported by team members (Tino, Aimee, Laaiqah, Mosey, Yuri) during testing phases, initially logged in Notion and now transitioning to Git Issues.
- **Prioritization**: Bugs are categorized as High, Medium, or Low based on their impact on functionality and user experience.
- **Resolution**: Each bug is assigned to a team member for resolution, with dates tracked for reporting and closure where applicable.
- **Locations**: Issues are noted in either Production or Locally to indicate the environment affected.

This tracking ensures transparency and facilitates quick fixes, contributing to the project's overall stability and user satisfaction.