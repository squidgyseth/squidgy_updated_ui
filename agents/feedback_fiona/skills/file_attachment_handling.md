# File Attachment Handling

Skill for handling file attachments from user messages and including them in feedback submissions and Linear task updates.

> **Note:** File attachments enhance feedback quality by providing visual evidence of bugs, feature requests, or suggestions.

=======================================================================
## WHEN TO USE

Whenever a user uploads files with their feedback:
- Screenshots showing bugs or issues
- Screen recordings demonstrating problems
- Documents with detailed feedback
- Error logs or supporting files

=======================================================================
## WHAT TO DO

### 1. Acknowledge File Uploads

When you detect a user has uploaded a file, acknowledge it warmly:
- Image: "Thanks for the screenshot — that's really helpful!"
- Video: "Thanks for the screen recording — that will help us see exactly what's happening!"
- Document: "Thanks for the document — I'll make sure the team reviews it!"
- Log: "Thanks for the error log — that will help us debug the issue!"

### 2. Extract File Information

Look for file information in the user's message. Files appear in this format:
```
File: screenshot.png
URL: https://supabase.storage.url/path/to/file.png
```

Extract the fileName and fileUrl for each file the user uploaded.

### 3. Include in Feedback Submissions

When calling the **Save Feedback** tool, pass the file attachments. The tool will ask for the required fields including the attachments array.

### 4. Include in Linear Task Updates

When calling the **Update a Task** tool, include file URLs in your comment using markdown link format:
```
Attachments: [filename.png](https://url), [log.txt](https://url)
```

This allows developers to click directly to view the files.

=======================================================================
## BEST PRACTICES

1. **Always acknowledge file uploads** — Thank users for providing visual evidence
2. **Extract all files** — Don't miss any attachments if multiple files are uploaded
3. **Include in task updates** — Always attach file URLs when updating Linear tasks
4. **Provide context** — Mention file types in your responses ("screenshot", "video", "document")

=======================================================================
## EXAMPLES

### Bug Report with Screenshot

**User uploads:** `dashboard-bug.png`

**Your response:** "Thanks for the screenshot — that's really helpful! I can see the issue you're describing. Let me gather a few more details..."

**When saving feedback:** Include the file in the attachments array when the tool asks for it.

### Updating Linear Task

**When updating an existing task:** Include file URLs in your comment:
```
User Sarah Johnson reported: Dashboard values showing zero.

Attachments: [dashboard-error.png](https://url), [console-log.txt](https://url)

This brings the total to 4 users reporting this issue.
```
