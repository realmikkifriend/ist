# Ist behavior spec (non-executable BDD)
#
# This file reconciles desired behavior with ACTUAL app behavior (Phase 4.2,
# 2026-09-30). Where actual behavior deviates from an ideal, it is documented
# as-is and flagged with a `TODO:` gap. Scenarios covered by the Playwright
# e2e suite carry a `# e2e: <spec> › "<test name>"` mapping comment;
# `TODO (e2e):` marks scenarios 4.3 should add specs for.

Feature: Auth & Onboarding

  As a user, I want to sign in to my Todoist account
  So that the app can show my tasks.

  Scenario: Unauthenticated user sees the landing page
    # e2e: landing.spec.ts › "renders the hero heading and the Todoist entry point"
    GIVEN the app is loaded with no stored Todoist access token
    WHEN the app initializes
    THEN the landing page is displayed with a "Continue with Todoist" button.

  Scenario: The Todoist Client ID is not configured
    GIVEN the app is loaded with no stored Todoist access token
    AND the TODOIST_CLIENT_ID environment value is missing
    WHEN the landing page is displayed
    THEN the entry point is a disabled button labeled "Todoist Client ID not configured".

  Scenario: Full login flow displays the first due task
    # e2e: auth.spec.ts › "full login flow displays the first due task"
    GIVEN the app is loaded with no stored Todoist access token
    WHEN the user clicks "Continue with Todoist"
    AND the OAuth code is exchanged for an access token
    THEN the access token is stored
    AND the app mounts and displays the current first-due task.

  Scenario: Token exchange fails
    GIVEN the app received an OAuth callback with a valid code
    AND the token exchange request fails
    THEN the failure is logged to the console only
    AND the user remains on the "Authenticating..." screen.
    TODO: surface a visible error with a retry path instead of a silent console error.

  Scenario: Log out
    GIVEN the user is signed in
    WHEN the user clicks "Log Out" in the sidebar
    THEN all persisted app state is reset, including both access tokens
    AND the landing page is displayed.

Feature: Task Display

  As a user, I want to see the most important task I can work on now
  So that I am not juggling my whole list.

  Scenario: App loads and displays the first-due task
    # e2e: auth.spec.ts › "full login flow displays the first due task"
    GIVEN the app is loaded and data refreshes on startup
    WHEN the app initializes
    THEN the current first-due task is displayed.

  Scenario: Display "no tasks" component when no tasks are due
    # e2e: task-display.spec.ts › "shows NoTasks when nothing is due"
    GIVEN there are tasks but none are due
    WHEN the app loads
    THEN the NoTasks component is displayed with Today and Tomorrow agenda buttons.

  Scenario: Display "no tasks" state when the account has no tasks at all
    # e2e: task-display.spec.ts › "shows NoTasks when the account has zero tasks"
    GIVEN the account has zero tasks
    WHEN the app loads
    THEN the NoTasks component is displayed with Today and Tomorrow agenda buttons
    AND the "No tasks, try adding some" placeholder is not displayed because the task list is an empty (truthy) array.
    TODO: decide the intended zero-task state; the "No tasks, try adding some" branch in AppView is dead code.

  Scenario: Due task ordering
    # e2e: task-display.spec.ts › "sorts due tasks by context, then priority, then due date"
    GIVEN there are multiple due tasks
    WHEN the app determines the first-due task
    THEN tasks are ordered by context order (tasks without a context first), then priority (highest first), then due date (earliest first).

  Scenario: Refresh data
    GIVEN the app is loaded and signed in
    WHEN the user clicks the refresh button or presses r
    THEN the Todoist data is refetched
    AND a "Todoist data updated!" success toast is shown.
    AND data is also refreshed automatically every 5 minutes.

  Scenario: Overdue tasks are auto-deferred to today
    # e2e: task-display.spec.ts › "auto-defers overdue tasks to today on refresh"
    GIVEN there are tasks whose due date is before today
    WHEN the data refreshes
    THEN those tasks are deferred to today, keeping the original time-of-day when the due string defines one
    AND a subsequent refresh does not defer them again.

  Scenario: A refresh happens while the display debounce is active
    # e2e: task-refresh.spec.ts › "keeps the displayed task while the 2 s display debounce is active"
    GIVEN a task is displayed
    AND less than 2 seconds have passed since the last display update
    WHEN new data arrives
    THEN the currently displayed task is kept unchanged.

  Scenario: The first-due task changes while the user is on another task
    # e2e: task-refresh.spec.ts › "shows a new-first-due-task toast when the first due task changes"
    GIVEN a task is displayed
    AND it was not summoned from the agenda
    AND the agenda is not open
    WHEN a refresh surfaces a different first-due task
    THEN a "New first-due task! Click to update..." info toast is shown
    AND clicking the toast displays the new task.
    AND the toast is only shown when no context is selected, or the previous task belongs to the selected context.

  Scenario: The displayed task has comments
    GIVEN the displayed task has comments
    WHEN the task is displayed (on a wide screen)
    THEN the comments are rendered below the task card as markdown
    AND while loading a "Loading comments..." indicator is shown
    AND on failure an "Error loading comments" message is shown.

  Scenario: The displayed task is a routine that has never been done
    GIVEN the displayed task has never been completed
    WHEN the task card is displayed
    THEN the done button and the history button are hidden.

  Scenario: Data loading fails
    # e2e: task-refresh.spec.ts › "shows NoTasks and an error toast when the initial refresh fails"
    # e2e: task-refresh.spec.ts › "keeps the displayed task and shows an error toast when a refresh fails"
    GIVEN a data refresh fails (initial or subsequent)
    WHEN the app initializes (or the user refreshes)
    THEN an error toast with the API error message is shown
    AND on an initial failure the NoTasks component is displayed
    AND on a subsequent failure the displayed task is unchanged.
    TODO: the "Error loading Todoist data: {message}" screen is dead code because handleRefresh routes errors to the todoistError store instead of rejecting.

Feature: Contexts

  As a user, I want to filter my due tasks by context
  So that I can focus on one area at a time.

  Scenario: The context sidebar lists contexts with due counts
    GIVEN the app is loaded and due tasks exist
    WHEN the user opens the sidebar (c)
    THEN each non-inbox context is listed with its due-task count and priority breakdown
    AND a context is disabled when it has no due tasks or when a different context is selected.

  Scenario: Filter displayed tasks by selected context
    # e2e: contexts.spec.ts › "context filter turns on and off"
    GIVEN there are tasks due in multiple contexts
    WHEN the user selects a context in the sidebar
    THEN the first due task of that context is displayed.

  Scenario: The user can clear the selected context
    # e2e: contexts.spec.ts › "context filter turns on and off"
    GIVEN a context has been selected
    WHEN the user de-selects the context
    THEN the selection is cleared
    AND the general due tasks are displayed
    AND a "New first-due task!" toast is shown to confirm the general task.

  Scenario: The selected context has no due tasks left
    # e2e: contexts.spec.ts › "auto-unselects a selected context when it has no due tasks left"
    GIVEN a context has been selected
    WHEN no due tasks remain in that context
    THEN the selected context is un-set
    AND the general due tasks are displayed.

  Scenario: Reorder contexts
    # e2e: contexts.spec.ts › "drag reordering contexts syncs the new order and re-evaluates the task"
    GIVEN the user has dragged a context to a new position in the sidebar
    WHEN the drag is finalized
    THEN the new order is saved to Todoist (project_reorder)
    AND a "Contexts reordered successfully!" toast is shown
    AND the displayed task is re-evaluated under the new order.

  Scenario: Task search
    # e2e: contexts.spec.ts › "task search finds non-due tasks and summons the pick"
    GIVEN the user opens the task search modal (/)
    WHEN the user types a search term
    THEN tasks from the full task list (not just due tasks) matching the term are listed
    AND pressing Enter or clicking a result summons that task and closes the modal
    AND "No results..." is shown when nothing matches.

  Scenario: Context badge
    GIVEN a task is displayed and the agenda is not open
    WHEN the main view is rendered
    THEN a context badge shows the selected context, or the displayed task's context when none is selected.

Feature: Done / Defer

  As a user, I want to complete or reschedule the displayed task
  So that the app can move on to what is next.

  Scenario: Display next due task after completing or deferring
    # e2e: done-defer.spec.ts › "done and defer advance to the next due task"
    GIVEN a task is displayed
    WHEN the task is marked done (CTRL+Enter) or deferred (d)
    THEN the task is removed from the local list
    AND the data is refreshed
    AND the next due task is displayed.

  Scenario: The defer modal offers time and calendar picking
    # e2e: defer-modal.spec.ts › "tasks with a due time start on the time tab; arrow keys switch tabs"
    # e2e: defer-modal.spec.ts › "all-day tasks start on the calendar tab"
    GIVEN the user opens the defer modal (d)
    WHEN the modal is displayed
    THEN it shows Time and Calendar tabs (switchable with the arrow keys), with the Time tab active initially for timed tasks
    AND the Time tab offers quick options such as "tomorrow".

  Scenario: Deferring a timed or recurring task keeps its time-of-day
    # e2e: defer-modal.spec.ts › "calendar tab: deferring to a specific date keeps the time of day"
    # e2e: defer-modal.spec.ts › "calendar tab: deferring an all-day task to a specific date defers without a time"
    GIVEN the displayed task has a due string that defines a time
    WHEN the user defers it to a specific date
    THEN the new due datetime keeps the original time-of-day.

  Scenario: Completing a recurring task re-defers it first
    # e2e: done-defer.spec.ts › "marking a recurring task done re-defers it to today and closes it"
    GIVEN the displayed task is due to repeat
    WHEN the user marks it done
    THEN the task is first re-deferred to today, keeping the time from its current due string when one can be parsed
    AND it is then marked done in Todoist
    AND a temporary activity entry is added for today.
    TODO: after an overdue auto-defer rewrites the local due string to a date ("yyyy-MM-dd"), the re-defer has no time to keep and lands on midnight, silently losing the recurring time.

  Scenario: Done or defer fails
    # e2e: done-defer.spec.ts › "marking done fails: error toast, displayed task unchanged"
    # e2e: defer-modal.spec.ts › "deferring fails: error toast, displayed task unchanged"
    GIVEN the displayed task is done or deferred
    WHEN the corresponding Todoist API call fails
    THEN an error toast is shown ("Failed to mark task done." / "Failed to defer task.")
    AND the displayed task is unchanged.

  Scenario: The displayed task was summoned from the agenda
    GIVEN a task was summoned while an agenda hash was open
    WHEN the task is done or deferred
    THEN the window hash is restored to the agenda it was summoned from.

Feature: Agenda

  As a user, I want to see my day and tomorrow laid out
  So that I can pull any task forward.

  Scenario: Summoning a task from the agenda closes the agenda and displays the task
    # e2e: agenda.spec.ts › "summoning a task from the agenda closes it and displays the task"
    GIVEN the agenda view is open
    WHEN the user clicks the time button of a specific task
    THEN the agenda view closes
    AND the summoned task is displayed.
    AND summoning an already-displayed task does nothing.

  Scenario: Switch agenda views
    # e2e: agenda.spec.ts › "the a key, NoTasks, and close button switch agenda views"
    GIVEN the app is loaded
    WHEN the user presses a
    THEN the agenda cycles between today, tomorrow, and closed
    AND the agenda can also be opened from the sidebar or the NoTasks page and closed with its close button.

  Scenario: The agenda header summarizes the day
    # e2e: agenda.spec.ts › "agenda header splits the day's tasks from routines"
    # e2e: agenda.spec.ts › "agenda header warns about tasks left over from today (tomorrow view)"
    GIVEN an agenda view is open
    WHEN the agenda header is rendered
    THEN it shows the total task count split into normal tasks and routines (never-done tasks)
    AND on the tomorrow view it also warns about tasks left over from today.

  Scenario: The agenda body lists the day
    # e2e: agenda.spec.ts › "the agenda body lists all-day tasks above the hour grid, with a 4+ overflow"
    GIVEN an agenda view is open
    WHEN the agenda is rendered
    THEN tasks without a time are listed at the top
    AND tasks with a time are grouped in an hour grid (7:00 to 21:00 at minimum).

  Scenario: Schedule a task from the agenda
    # e2e: agenda.spec.ts › "scheduling from the agenda defers the task to the picked time"
    GIVEN the agenda view is open
    WHEN the user clicks the schedule control of a task
    THEN a schedule modal opens for a specific date and time
    AND confirming defers the task and shows "Task scheduled successfully."

  Scenario: The displayed task is highlighted in the agenda
    # e2e: agenda.spec.ts › "the displayed task is highlighted in the agenda"
    # e2e: agenda.spec.ts › "the displayed all-day task is highlighted in the agenda"
    GIVEN a task is currently displayed
    WHEN the agenda view is open
    THEN the displayed task is marked with a highlight and an inbox icon.

Feature: Dynalist

  As a user, I want Dynalist links in task comments to become interactive
  So that I can work through linked documents from Ist.

  Scenario: A Dynalist URL appears in a comment without a stored token
    GIVEN the displayed task has a comment starting with https://dynalist.io/d/
    AND no Dynalist access token is stored
    WHEN the comments are rendered
    THEN a Dynalist access token request form is shown
    AND the comment itself shows "Dynalist URL detected but no access code stored."
    TODO (e2e): add a spec for the auth request flow.

  Scenario: Store a Dynalist access token
    GIVEN the Dynalist token request form is shown
    WHEN the user submits a token
    AND the token validates against the Dynalist API
    THEN the token is stored and a "Dynalist access token set!" toast is shown
    AND the comment re-renders with the interactive Dynalist content
    AND an invalid token shows an inline "Invalid token" message instead.

  Scenario: Load and render a Dynalist document
    GIVEN a valid Dynalist token is stored
    AND a comment contains a Dynalist URL
    WHEN the comments are rendered
    THEN the document is fetched and rendered according to its detected type
    AND the type can be switched with the type menu (read, checklist, count, rotating, cross off, tracking)
    AND on fetch failure an error toast and inline error message are shown.
    TODO (e2e): add specs for type detection and the type menu.

  Scenario: Checklist
    # e2e: dynalist.spec.ts › "dynalist URL in a comment renders an interactive checklist"
    GIVEN a Dynalist document is rendered as a checklist
    WHEN the user clicks "Next item" (z / Enter)
    THEN the next checklist item is shown with a strike animation
    AND a progress bar and counter track the position
    AND "End of list!" is shown at the end with a reset button.
    TODO: checklist progress is local to the app and is not written back to Dynalist.

  Scenario: Count
    GIVEN a Dynalist document is rendered as a counter
    WHEN the user clicks +1 or -1
    THEN the current count is updated in the Dynalist document
    AND an "Updated count!" toast is shown.
    TODO (e2e): add a spec for the count widget.

  Scenario: Cross off
    GIVEN a Dynalist document is rendered as a cross-off list
    WHEN the user clicks the cross-off button (z / Enter)
    THEN the first item is marked checked in the Dynalist document
    AND it is removed from the local list with a remaining-count indicator
    AND a "Removed from list in Dynalist!" toast is shown.
    TODO (e2e): add a spec for cross-off.

  Scenario: Tracking
    GIVEN a Dynalist document is rendered as a tracker
    WHEN the user clicks the tracking button
    THEN today's date is added to (or removed from) the document's tracked dates
    AND a calendar modal can show the tracked dates.
    TODO (e2e): add a spec for tracking.

  Scenario: Cycle comment focus
    GIVEN the displayed task has focusable comment content
    WHEN the user presses z
    THEN focus moves to the next comment focus target, wrapping around.

Feature: Activity & History

  As a user, I want to see what I have completed
  So that I can keep a daily goal and review a task's history.

  Scenario: Daily goal
    GIVEN the app is loaded and signed in
    WHEN the sidebar is rendered
    THEN a daily goal pill shows today's completions against the user's daily goal
    AND completions are segmented by context color, with an overflow segment when the goal is exceeded
    AND clicking the pill reloads today's activity, discarding temporary entries.
    TODO (e2e): add a spec for the daily goal pill.

  Scenario: Completing a task updates today's activity immediately
    GIVEN the user marks a task done
    WHEN the completion succeeds
    THEN a temporary activity entry for that task is added to today's activity.

  Scenario: Task completion history
    GIVEN the displayed task has been completed before
    WHEN the user presses h or clicks the history button
    THEN a calendar modal shows the task's completion dates (last 3 months), with future dates disabled.
    TODO (e2e): add a spec for the history calendar.

Feature: State Persistence

  As a user, I want my app state to survive a reload
  So that I do not lose my place.

  Scenario: State persists across reloads
    GIVEN the app has been used
    WHEN the app is reloaded
    THEN the Todoist data, displayed task, activity, selected context, and both access tokens are restored from localStorage
    AND transient state (previous task, error, toasts, hash) starts fresh.
    TODO (e2e): add a spec for state restoration on reload.

  Scenario: App loads with a persisted token
    # e2e: live.todoist.spec.ts › "renders real data from api.todoist.com"
    GIVEN a valid Todoist access token is stored
    WHEN the app is loaded
    THEN the app is authenticated and renders data from api.todoist.com without showing the landing page or an error.

  Scenario: A summoned task persists across reloads
    GIVEN a task was summoned and the app is reloaded
    WHEN the app initializes
    THEN the persisted summoned task is displayed again
    AND the initial data refresh is skipped.
    TODO: the original spec expected app load to RESET the summoned task and selected context; the app actually persists them. Decide the desired behavior.
    TODO (e2e): add a spec for the summoned-task load-skip.
