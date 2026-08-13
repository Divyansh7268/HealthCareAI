# Synchronization Strategy

The sync mechanism ensures data consistency between the local SQLite database and the Firebase/Node.js backend.

## The Sync Queue (`sync_queue` table)

Every mutation (Create, Update, Delete) made while offline is recorded in the `sync_queue` table with the following properties:
- `operationId`: A unique UUID for idempotency.
- `entityType`: The type of data (e.g., `patient`, `visit`, `media`, `assessment`).
- `operationType`: `create`, `update`, or `upload`.
- `payload`: The JSON-serialized data to send to the server.
- `status`: `pending`, `synced`, `failed`, or `conflict`.

## Sync Manager

The `SyncManager` (`src/storage/sync/syncManager.js`) listens to `@react-native-community/netinfo`. When the connection status changes to `true`, the manager locks the queue (`isSyncing = true`) and processes pending operations sequentially.

### Media Uploads
Media files (images, audio recordings) are saved to the device's local file system via Expo. The queue stores the `fileUri`. During sync, the `UploadManager` requests a signed GCS URL from the backend and pushes the binary data via `FileSystem.uploadAsync`.

### Conflict Handling
VirtualCare clinical data uses an **append-only / non-destructive** sync strategy.
- If a local visit is updated offline, but the server has a newer `updatedAt` timestamp, the `SyncManager` marks the local record as `conflict`.
- Doctor decisions (e.g., approved/rejected plans) always take precedence over health-worker drafts.
- No local data is silently overwritten if it conflicts with the server; it is flagged for manual review by the user.
