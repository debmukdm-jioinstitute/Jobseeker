# Agent inbox

Drop a `.json` file here (GitHub: Add file → Upload files). It is merged into the site within about a minute,
then the file is removed. Any file name works; the part before the first `-`/`_`/digit becomes the source name
if records have no `source` (e.g. `muse-2026-10-19.json` → "muse").

A file is a JSON array (or `{ "items": [...] }`) of records:

```json
{
  "id": "LinkedIn-7123456",
  "title": "FP&A Manager",
  "company": "Acme Capital",
  "loc": "Mumbai, India",
  "date": "2026-10-19T08:00:00Z",
  "source": "LinkedIn",
  "poster": "Jane Doe, CHRO",
  "instruction": "Fill the form",
  "leads": [{ "kind": "form", "value": "https://forms.gle/abc" }, { "kind": "email", "value": "jobs@acme.com" }],
  "text": "We're hiring ..."
}
```
Only `title` or `text` is required. Missing `leads`, `company` and `instruction` are extracted from `text`.
`kind` is `form`, `email`, `jobpage` or `link`. Only http(s) links and valid emails are kept.
