# Schema Map

## Canonical Tables

- **forms**: Active table for Forms Center.
- **file_records**: Active table for file metadata.
- **user_preferences**: Stores per-user settings buckets.
- **notifications**: Stores in-app notification records.

## Legacy Aliases

- **internal_forms**: Alias for `forms`.
- **workspace_files**: Alias for `file_records`.

## Notes

- Legacy aliases are optional and not required for runtime functionality unless explicitly referenced in external dependencies.
- Do not add duplicate tables without a real runtime requirement.
