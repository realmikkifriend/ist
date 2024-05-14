# UX Strategy: Ist

Developed by Mikki Friend.

## 1. Introduction & Background

I have always had extra trouble completing the tasks of daily living. I designed Ist over many years and iterations, incorporating the knowledge of occupational therapists (those who study how to help people do things better) to support the following executive functions:

-   **Task prioritization**: I am very good at making a detailed list of everything I need to do. But when I try to do the things on the list, I have trouble figuring out which are most important or need to be done in order.
-   **Task initiation**: If I'm not confident that the next task is the 'right' thing to do next, I procrastinate and lose track of time.
-   **Sustained attention**: I find it hard to stay focused on one thing for a long time. I work best when the task is broken down into smaller steps, presented one at a time. I can multitask within reason, as long as I am reminded to not forget about a task while doing others.
-   **Working memory**: If I can't work on a task right now, I don't want to see it and risk being distracted. I would rather have tasks hidden until I need them.

Ist helps people like me complete tasks with less distraction.

### 1.1. Pre-Production Deliverables

The following UX deliverables were created during planning:

-   This project proposal
-   User personae (see below)

Since this app uses a relatively simple design and is based on a private functioning prototype, I skipped wireframing.

### 1.2. Glossary

-   **context**: The place or situation in which one can accomplish a task, whether general or specific (e.g. the context of 'brush teeth' can be 'home' or 'bathroom'; 'buy milk' is accomplished in 'errands' or 'the grocery store down the street').
-   **defer**: To delay a task until later.
-   **goal**: A result that a person wants to see in their lives. Reaching a goal often involves both projects and gradual personal growth.
-   **priority**: How important and urgent a task is to the user.
-   **project**: A larger set of tasks that must be completed (usually in order) to create a larger result.
-   **task**: A set of steps that must be completed to create a result. Can repeat, or be part of a larger project.
-   **tasks of daily living**: Encompasses two occupational therapy concepts:
    -   _Activities of Daily Living (ADLs)_ must be completed to live a healthy life, such as feeding, grooming, and other self-care.
    -   _Instrumental Activities of Daily Living (IADLs)_ are important to maintaining an independent life, and include cooking, housecleaning, and managing time and information.

## 2. Project Proposal

Ist is a task management tool designed to support users with difficulties in task prioritization, initiation, sustained attention, and working memory.

### 2.1. Problem Statement & Scope

To-do lists are a helpful tool, but less effective when the user has difficulties with the executive functions of task prioritization and initiation, sustained attention, and working memory. Users expressed challenges in determining the importance of tasks, initiating tasks without confidence, maintaining focus for extended periods, and managing tasks that are not immediately actionable.

These pain points highlight the need for a solution that supports organizing tasks based on priority, facilitating task initiation, breaking down tasks into manageable steps, and controlling visibility of tasks based on current relevance.

The scope of the solution encompasses addressing these specific challenges.

### 2.2. Proposed Solution

Ist supports task prioritization and initiation, sustained attention, and working memory. It should provide features that help prioritize task lists, start tasks confidently, break down tasks into smaller steps for better focus, and hide tasks that are not currently being worked on to avoid distractions. By incorporating these functionalities, Ist aims to boost effectiveness and satisfaction of individuals struggling with these executive functions.

#### 2.2.1 Octalysis Analysis

Ist can be broken down according to the [Octalysis Framework of app gamification](https://yukaichou.com/gamification-examples/octalysis-complete-gamification-framework/):

-   **Core Drive 1: Epic Meaning**: Ist addresses an individual's need to accomplish tasks more effectively, thus helping them feel like they are contributing to their own personal improvement and growth. Users seek greater purpose through managing their tasks and responsibilities. A solution tailored to their needs and specific challenges provides a sense of being 'chosen' to use this tool.
-   **Core Drive 2: Development & Accomplishment**: By design, Ist encourages self-development and personal effectiveness. Marking each task 'done' must provide satisfying feedback. Displaying progress is essential; similar to Todoist, Ist will display completed tasks using a color-coded bar, subtly encouraging users to fill it out each day. Task streaks, custom daily quests, and weekly stats are potential future features. The brain hates incomplete things, so the interface might also emphasize both progress and what is left to complete.
-   **Core Drive 3: Empowerment of Creativity & Feedback**: Through Ist's unique way of displaying tasks, users can experiment with breaking down tasks and organizing them to suit their workflow, fostering a sense of creativity in task management. This feedback loop encourages users to continue engaging with the app and refining their strategies. Ist is an evergreen tool, remaining engaging and relevant over time without the need for constant updates or additions of new features.
-   **Core Drive 4: Ownership & Possession**: By forcing focus on a single task at a time, Ist encourages users to think about each task and take ownership of its specifics. This leads to cultivation of one's task list, to make it more effective within Ist and thus overall. Displaying completed tasks, custom quests, and streaks might incorporate aspects of collection and trophies.
-   **Core Drive 5: Social Influence & Relatedness**: Ist fosters a sense of acceptance by acknowledging and addressing users' challenges. A future feature might allow users to share/embed a page with their stats and streaks.
-   **Core Drive 6: Scarcity & Impatience**: By reducing the abundance of tasks, Ist inherently increases engagement with task lists. For target users, satisfaction and accomplishment are scarce prizes; Ist removes enough distraction that the internal drive to complete tasks can take over. A major goal is to optimize the experience so that users open Ist when bored.
-   **Core Drive 7: Unpredictability & Curiosity**: Functionality should be clear within seconds; by design, Ist clarifies ambiguity and displays a 'glowing choice' in the form of a single task to accomplish or prioritized context to choose. The methods Ist uses to prioritize tasks are relatively straightforward, but may appear unpredictable to some end users, promoting curiosity. Completing subtask checklist items, tasks, and other actions should have immediate, satisfying click effects.
-   **Core Drive 8: Loss & Avoidance**: To reduce loss of time and productivity, Ist focuses the user on tasks that can be accomplished now, diverting attention from FOMO and overwhelm. Overdue tasks are automatically rescheduled.

Broken down by the four phases of user engagement:

-   **Discovery**: Users are motivated to start using Ist because it offers improved effectiveness, sense of purpose, and satisfaction (Core Drive 1, Epic Meaning). They are intrigued by the prospect of marking tasks as done and seeing their progress visually, fostering a sense of achievement (Core Drive 2: Development & Accomplishment). Satisfaction is recognized as a scarce prize, to which Ist offers a smoother route (Core Drive 6: Scarcity & Impatience).
-   **Onboarding**: In part, the interface will be intuitive without need for explicit instructions, relying on the inherent drive to complete tasks (Core Drive 2: Development & Accomplishment). The initial unpredictability of task prioritization will spark interest and encourage engagement (Core Drive 7: Unpredictability & Curiosity). Early experiences should subtly emphasize how much time and energy users are saving by focusing on actionable tasks (Core Drive 8: Loss & Avoidance).
-   **Scaffolding**: As users grow accustomed to the interface, they will be encouraged to experiment with task organization and refine their strategies (Core Drive 3: Empowerment of Creativity & Feedback). Ist fosters a sense of ownership of and responsibility for tasks (Core Drive 4: Ownership & Possession).
-   **Endgame**: Ist will retain veteran users using features like task streaks, custom daily quests, and weekly stats (Core Drive 2: Development & Accomplishment). As they accomplish more, they will integrate it into their regular habits (Core Drive 1, Epic Meaning).

### 2.3. Analysis

#### 2.3.1 Competitive Analysis

The productivity space is full of strong competitors with larger budgets, established brand recognition, and wide ranges of features and customization options. However, no tool offers the focus-promoting interactivity of Ist. As demand grows for task management for neurodivergent users, apps with complex interfaces and overwhelming information will not be prepared. Developing a micro-app with a strong focus on simplicity and effectiveness will differentiate Ist in a crowded market. If neurodivergent users overcome the initial hurdle of switching to a new app, they will find that it fits much better with their cognitive style.

#### 2.3.2 Risk Assessment & Mitigation

-   **Risk**: Users, especially those who struggle with executive function, may resist switching task management tools due to familiarity with and investment in their current system.
    -   **Mitigation**: Highlight the unique ways Ist addresses their specific challenges. Offer a user-friendly onboarding process and easy set-up guides.
-   **Risk**: Users may initially engage but gradually lose interest or fail to see the long-term value, leading to low retention.
    -   **Mitigation**: Implement gamification elements such as task streaks, custom daily quests, and weekly stats to encourage sustained engagement. Regularly update and enhance Ist based on user feedback to keep the platform engaging and relevant.
-   **Risk**: Users working with varying cognitive challenges may struggle to navigate and utilize Ist effectively, leading to frustration and disengagement.
    -   **Mitigation**: Conduct user research and testing with individuals representing a diverse range of cognitive abilities, to ensure Ist is intuitive and accessible to all users. Provide clear, simple instructions and support features for users who may require additional assistance.

### 2.4. Functional Requirements

-   A front page and documentation that clarify features and their uses
-   Quickly and smoothly log into Todoist and Dynalist, with security assurances
-   User-friendly onboarding process and set-up guides
-   Show only the single task that is accessible and most important right now
-   Satisfying to mark task 'done', quick and easy to defer with precision
-   Customization options (e.g. urgency vs. importance, order of contexts), organize tasks to suit ever-changing individual workflow
-   Break down tasks into checklists for better focus
-   Progress tracking with color-coded bars and potential future features like task streaks, custom daily quests, and weekly stats
-   Accessibility features and audits to ensure usability
-   Edit task metadata inline (e.g. priority, context, comments)

### 2.5. Stakeholders & Communication Plan

I am a solo developer and the only stakeholder. I will regularly commit project updates to [the Github repo](https://github.com/realmikkifriend/ist/).

### 2.6 Technical & Resource Requirements

This project should incur almost zero expenses. Only a very simple server setup is required. If Ist's user base ever grows, I can look into scalable cloud hosting. All data is stored by Todoist and Dynalist and accessed via their APIs, except basic user information stored as browser cookies. Because I'm most familiar with JavaScript, the app will be written using a JS front-end framework and NodeJS as a back-end.

As a solo developer, I will fulfill roles of project management, front- and back-end development, interface design, testing, and deployment.

### 2.8. Evaluation & Success Measures

Should user engagement and retention ever become important measures within this project, they will be tracked according to the following metrics:

-   **User Engagement**: Daily active users (DAU) and weekly active users (WAU)
-   **Task Completion Rate**: Percentage of (anonymized) tasks marked 'done' by users.
-   **Satisfaction**: Conduct user surveys to evaluate satisfaction.

## 3. User Research

### 3.1. User Personae

Because I'll probably be the only user, I created a basic 'new user' persona and another about myself.

-   A [new user persona](persona-new.md)

| User Summary | Anyone (18-45), _A New User_                       |
| ------------ | -------------------------------------------------- |
| Background   | Basic familiarity with tech                        |
| Goals        | Saving trouble & being more productive             |
| Frustrations | Long/complicated on-boarding, bugs & interruptions |
| Needs        | Minimal effort & buy-in, clear & simple interface  |
| Attitudes    | Open to new methodology, wants easy as possible    |

-   A [neurodivergent user persona](persona-nd.md)

| User Summary | Mikki (30s), _A Neurodivergent User_   |
| ------------ | -------------------------------------- |
| Background   | Educated & familiar with tech          |
| Goals        | Get help prioritizing task list        |
| Frustrations | Too much information, distractions     |
| Needs        | Clear & simple navigation              |
| Attitudes    | Appreciates structure & predictability |

In conclusion, needs analysis shows:

-   User Backgrounds: Basic to expert at tech, neurotypical or neurodivergent
-   User Goals: Prioritization, focus, accomplishment
-   User Frustrations: Complication, distraction, bugs, interruptions
-   User Needs: Clear & simple interface, minimal onboarding
-   User Attitudes: Open to new ideas as long as they are structured and easy to use
