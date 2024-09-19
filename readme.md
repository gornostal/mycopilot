# Lightweight AI Copilot

### Configure

Install `nodejs` v22 or higher.

Clone and create `.env` file like this:

```env
OPENAI_API_KEY=sk-...
```

In your work project add `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run My Copilot",
      "type": "shell",
      "command": "/home/olek/projects/mycopilot/mycopilot.sh",
      "args": ["${file}"],
      "problemMatcher": [],
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "close": false,
        "panel": "shared"
      }
    }
  ]
}
```

### Run

Write prompt like

```
@filename1
@filename2

In a similar way to the above write tests for the class below:

@filename3
```

Run `My Copilot` task from vscode.
