This document contains UX and functional corrections observed during real usage testing of Nefera.

This document OVERRIDES any conflicting UX or behavior in masterplan.md.

These are not optional improvements.
These are mandatory product corrections to be implemented.

------------------------------------------------------------
STUDENT DASHBOARD CORRECTIONS
------------------------------------------------------------

1. Emojis in the check-in must be highly interactive (animated / responsive / visually engaging).

2. All questions must be rewritten in very clear, student-friendly English while keeping the meaning identical.

3. Every feeling selection must create a SEPARATE journal entry automatically with timestamp.

4. Students can add MULTIPLE journal entries in the same day.
   All must be visible.

5. All feeling-related questions must allow MULTIPLE selections.

6. The Journal writing screen must contain ONLY a blank text box.
   No prompts, no templates.

7. Saved Journal list behavior:
   - Show first few lines + timestamp
   - Dropdown expands to show full journal
   - Organized day-wise and week-wise
   - If multiple feelings logged in a day → all visible

8. Open Circle must be school-configurable:
   - Entire school
   - Class-wise
   - Grade-wise
   - Custom groups defined by school

9. Reports section:
   - Show emergency school contact panel
   - Student can see their own submitted reports with timestamp

10. Top-right positive message area:
   - Message from school to student
   - Word limit enforced
   - Controlled by school admin

------------------------------------------------------------
TEACHER DASHBOARD CORRECTIONS
------------------------------------------------------------

1. Teacher can send message to a specific student.

2. SMS module placeholder must exist in UI for future backend integration.

------------------------------------------------------------
PARENT DASHBOARD CORRECTIONS
------------------------------------------------------------

1. All selection lists must include “Other” option.

2. Parents see ONLY aggregated emotional percentages (not entries).

3. Parents can see data only till Grade 7.
   Beyond Grade 7 → restricted (school configurable).

4. Parents can see: "Did student journal today? Yes/No"

5. Parents can send message to:
   - Teacher
   - Counselor
   - Principal

------------------------------------------------------------
SCHOOL ADMIN & CUSTOMIZATION PANEL (NEW)
------------------------------------------------------------

Add a new Admin Section.

School admin can:
- Modify questions
- Configure dashboard visibility
- Configure grade access
- Configure Open Circle visibility
- Control positive message
- Control features visibility

Approval workflow:
- Any admin change → goes to Principal
- After approval → auto applied

All dashboards must respect school-controlled configuration.
