Feature: Task Display

  As a user, I want the application to behave in a specific way
  So that I can manage my tasks effectively.

  Scenario: App loads and displays the first-due task
    GIVEN the app is loaded
    WHEN the app initializes
    THEN the current first-due task is displayed.

  Scenario: App load resets state
    GIVEN a task was previously summoned, or skip mode was open, or a context was selected
    WHEN the app loads
    THEN the previously summoned task, skip mode, and selected context are reset.

  Scenario: Display 'no tasks' component when no tasks are due
    GIVEN there are no tasks due
    WHEN the app loads
    THEN the 'no tasks' component is displayed.

Feature: Filter by Contexts

  Scenario: Filter displayed tasks by selected context
  GIVEN there are tasks due
  WHEN the user has selected a context
  THEN tasks filtered by the selected context are displayed.

  Scenario: The user can clear the selected context
  GIVEN a context has been selected
  WHEN the user de-selects the context
  THEN the selected context is un-set and general due tasks are displayed.

  Scenario: The selected context has no due tasks left
  GIVEN a context has been selected
  WHEN there are no more tasks remaining in the selected context
  THEN the selected context is un-set and general due tasks are displayed.

Feature: After Done/Defer

  Scenario: Display next due task after completing or deferring
    GIVEN a task is displayed
    WHEN the task is deferred or marked as done
    THEN the next due task is displayed.

  Scenario: Display next skipped task in skip mode
    GIVEN the user is in skip mode
    WHEN a task is deferred or marked as done
    THEN the next task in the skip order is displayed.

Feature: Summoning a Task

  Scenario: Summoning a task from the agenda closes the agenda and displays the task
    GIVEN the agenda view is open
    WHEN a user clicks the 'summon' button for a specific task
    THEN the agenda view closes
    AND the summoned task is displayed.
