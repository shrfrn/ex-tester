# Using Config Files with Student Assignment Tester

You can now use a JSON config file to provide some or all of the prompts when running the tester application.

## Command Line Usage

```bash
node src/index.js --config path/to/config.json
```

Or, using the npm script:

```bash
npm run start:config
```

## Config File Format

The config file should be a JSON file with the following structure:

```json
{
    "submissionsPath": "/path/to/submissions",
    "exerciseRangeInput": "1-5, 8-10",
    "reportType": "htmlDetailed"
}
```
`submissionsPath` can also include a glob pattern instead of the student name segment which will produce the report for all students:

```json
{
    "startDir": "/path/to/start/navigation",
    "submissionsPath": "/path/to/{student:*}/submissions",
    "exerciseRangeInput": "1-5, 8-10",
    "reportType": "htmlDetailed"
}
```

This will generate reports for:

- /path/to/`student-1`/submissions
- /path/to/`student-2`/submissions
- /path/to/`student-3`/submissions
.
.
.
etc...

### Config Options

- `startDir`: The directory from which to start navigation (only used if submissionsPath is not provided)
- `submissionsPath`: The path to the folder containing student submissions
- `exerciseRangeInput`: The range of exercises to test (e.g., "1-13" or "1, 3-5, 12-13")
- `reportType`: The type of report to generate (options: mdOverview, csvOverview, mdDetailed, htmlOverview, htmlDetailed)

## Partial Configuration

You don't need to provide all options in the config file. The application will:

1. Use any values provided in the config file
2. Prompt you for any missing values

For example, if your config file only includes the submissionsPath:

```json
{
    "submissionsPath": "/path/to/submissions"
}
```

The application will use that path and then prompt you for the student name segment location, exercise range and report type.

If you only provide a startDir without a submissionsPath:

```json
{
    "startDir": "/path/to/start/navigation"
}
```

The application will start the file navigation from that directory, making it easier to quickly navigate to commonly used folders. 