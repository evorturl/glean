# G-7 Blocker And API Status

## Summary

The previously reported `G-7` blocker has been reviewed and corrected.

The root cause was not missing Indexing API permissions. The prototype was using the wrong datasource names and also generated `viewURL` values that did not match the selected datasource's URL regex. After correcting those issues, the required APIs were validated successfully.

This memo records:

- the corrected blocker diagnosis,
- the fix that resolved it,
- the tested status of the required APIs,
- and the current residual risk to keep in mind during later sprints.

## Corrected Diagnosis

### Original mistake

The earlier blocker investigation used datasource names such as `interviews`, `interviews2`, and so on.

The task brief actually refers to datasources named:

- `interviewds`
- `interviewds2`
- `interviewds3`
- `interviewds4`
- `interviewds5`
- `interviewds6`

Because the wrong datasource names were used, the earlier memo incorrectly concluded that the Indexing API token lacked the required scopes.

### Actual issue

Once the correct datasource names were tested, the token could access them successfully. The remaining ingest failure was:

```text
Indexing API error: code: 400, msg: View URL https://intranet.example.com/policies/remote-work-policy does not match the URL Regex pattern https://internal.company.com/interviewds/.* for the datasource.
```

So the real problem was:

1. wrong datasource names in the implementation and blocker memo, and
2. `viewURL` values that did not satisfy the sandbox datasource's configured URL pattern.

### Resolution

The prototype was updated to:

- default to `interviewds`,
- use the correct datasource family in CLI guidance and runtime defaults,
- initially generate datasource-compatible document URLs that matched the sandbox regex,
- later broaden the datasource regex so fixture documents could use their real GitHub blob paths under `fixtures/employee-support/`,
- retain optional `GLEAN_CLIENT_ACT_AS` support for the chat token.

After those changes, ingest succeeded and the end-to-end ask flow ran successfully.

## Required API Status

### 1. Indexing API

Status: working

Tested:

- yes

What was tested:

- direct datasource config lookups for `interviewds` through `interviewds6`
- prototype ingest command against `interviewds`

Successful validation:

```bash
npm run ingest -- --datasource interviewds --allowed-user-emails alex@glean-sandbox.com
```

Observed result:

- six fixture documents indexed successfully
- document processing was triggered successfully for the datasource

Permission status:

- sufficient for the real sandbox datasource names

Conclusion:

- the Indexing API is usable for the exercise

### 2. Search API

Status: working

Tested:

- yes

What was tested:

- direct request to `POST /rest/api/v1/search`
- prototype search path through `npm run ask`

Observed result:

- direct search requests returned successful responses
- the ask flow was able to retrieve results from the corrected datasource

Conclusion:

- the Search API is working for the exercise flow

### 3. Client / Chat API

Status: working with `X-Glean-ActAs`

Tested:

- yes

What was tested:

- direct request to `POST /rest/api/v1/chat` without `X-Glean-ActAs`
- direct request with `X-Glean-ActAs: alex@glean-sandbox.com`
- prototype ask flow with `GLEAN_CLIENT_ACT_AS=alex@glean-sandbox.com`

Observed result:

- without `X-Glean-ActAs`, the chat token failed
- with `X-Glean-ActAs`, chat returned a valid response
- the end-to-end ask flow completed successfully when the same auth mode was used

Implementation note:

- the prototype now supports optional `GLEAN_CLIENT_ACT_AS` so the chat flow can use this token correctly

Conclusion:

- the Chat API is usable for the exercise as long as the token is used with the correct auth header

## End-To-End Validation Status

Validated:

- `npm run typecheck`
- `npm run build`
- `npm run ingest -- --datasource interviewds --allowed-user-emails alex@glean-sandbox.com`
- `GLEAN_CLIENT_ACT_AS=alex@glean-sandbox.com npm run ask -- --datasource interviewds --question "Can I work remotely while attending a conference abroad?"`

Observed outcome:

- the fixture corpus was indexed successfully
- the search and chat workflow returned a grounded answer with sources

## Residual Risk

The selected sandbox datasource is not empty, so search results may include previously indexed documents in addition to the fixture corpus. This is not blocking, but it can affect how clean the returned citations look.

Potential follow-up improvement:

- add a stronger document-level filter or more distinctive document IDs/metadata if later validation needs tighter control over which indexed items appear in search results

## Recommended Next Step

The blocker issue created from the earlier diagnosis can be closed. `G-7` can now be reviewed based on a working end-to-end prototype rather than a blocked implementation.
