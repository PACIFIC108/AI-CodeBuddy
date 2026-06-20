# AI AlgoBuddy

AI AlgoBuddy is a Manifest V3 Chrome extension that adds contextual DSA assistance to LeetCode. It extracts the active problem, editor code, language, test cases, and submission verdict; an Express/MongoDB backend provides hints, debugging, dry runs, history, and progress analysis.

## AI credentials

The backend does not keep provider keys. Each user configures a provider in the extension popup:

- OpenRouter
- OpenAI
- A public HTTPS, OpenAI-compatible Chat Completions endpoint

The key is stored persistently in `chrome.storage.local` and sent to the configured backend only for an AI request. It remains there across browser restarts and extension updates, until the user clears extension data or uninstalls the extension. Chrome extension storage is not an encrypted secret vault, so this design is appropriate for a personal local extension but should be replaced by encrypted server-side credential storage if accounts are added later.

Custom endpoints using localhost, private IP addresses, embedded credentials, or plain HTTP are rejected to reduce server-side request-forgery (SSRF) risk. This is bring-your-own-key configuration, not application account authentication; usernames remain lightweight progress identifiers.

## Responsibility boundaries

- React (`Popup` and `Layout`) renders UI and emits actions.
- The LeetCode integration layer reads the page DOM and requests the complete Monaco editor model from a small page-world bridge. DOM extraction must run in the tab because the backend cannot access a user's live LeetCode page.
- The background service worker owns persistent extension storage and is the only client code that makes backend HTTP requests.
- The Express backend owns validation, intent routing, prompts, AI-provider calls, rate limiting, and MongoDB operations.

LeetCode is a single-page application (SPA): navigating between problems can update the URL and page content without performing a full browser reload. The content integration observes those transitions and mounts or removes the widget accordingly.

## Local setup

1. Copy `server/.env.example` to `server/.env` and set `mongo_URL`.
2. In `server`, run `npm install` and `npm run dev`.
3. In `client`, run `npm install` and `npm run build`.
4. Open `chrome://extensions`, enable Developer mode, and load `client/dist` as an unpacked extension.
5. Open the extension popup and save a LeetCode username, provider API key, and exact provider model ID.

For a deployed API, set `VITE_API_BASE_URL` before building and replace the localhost entry in `client/manifest.json` `host_permissions` with the deployed API origin.

Existing databases created by the old version may have submissions that are not referenced by users. Run `npm run migrate:history` once from `server` to backfill those relationships.

## Verification

- Client lint: `npm run lint`
- Client production build: `npm run build`
- Server unit tests: `npm test`

The server applies request-size limits, per-IP rate limits, input validation, restricted CORS, provider timeouts/retries, bounded chat history, and safe role normalization. No API key should be placed in `server/.env`.

## User-approved editor fixes

When the learner explicitly asks to fix, correct, edit, or repair their code, the backend requests a structured minimal correction from the model. The widget displays a red/green change preview and requires **Apply** or **Reject**. Apply targets the same Monaco model and succeeds only if its code contents still match what the AI analyzed; Monaco's internal version may change during harmless editor synchronization, so it is diagnostic rather than authoritative. The edit is added to Monaco's undo history, so `Ctrl+Z` restores the previous code. The extension never writes AI changes silently.
