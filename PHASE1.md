# Phase 1: Web Offline + Sync Foundation

## Overview

Phase 1 establishes the foundation for multi-platform deployment by adding offline capabilities and cross-device sync to the web application.

## What's Implemented

### 1. Monorepo Structure with pnpm
- `packages/shared/api-client/` - HTTP client with offline queue
- `packages/shared/store/` - Zustand state management
- `packages/shared/types/` - TypeScript types (shared across platforms)
- `packages/shared/utils/` - Utility functions
- `frontend/` - React web app (updated to use shared packages)
- `backend/` - FastAPI with new sync endpoint

### 2. Offline-First API Client
**Location**: `packages/shared/api-client/`

Features:
- IndexedDB-based offline storage
- Request queuing for offline mutations
- Smart caching with TTL
- Automatic retry with exponential backoff
- Background sync when coming online

```typescript
// Example usage
const client = getApiClient()

// GET with caching
const data = await client.get('/api/v1/family', { cache: true, cacheTtl: 60 })

// POST (auto-queues if offline)
const result = await client.post('/api/v1/medications', { name: 'Aspirin' })
```

### 3. Shared Zustand Stores
**Location**: `packages/shared/store/`

Stores:
- `useAuthStore` - Auth state, tokens, user info
- `useFamilyStore` - Family members list
- `useMedicationStore` - Medications by family member
- `useSyncStore` - Sync state, online/offline status

### 4. Service Worker for Offline Support
**Location**: `frontend/public/service-worker.js`

Features:
- Network-first for API calls (fallback to cache)
- Cache-first for static assets
- Background sync capability
- Offline error handling

### 5. Sync Endpoint (Backend)
**Location**: `backend/app/api/routes/sync.py`

Endpoint: `POST /api/v1/sync`

Functionality:
- Batch sync of client changes
- Server-authority conflict resolution
- Idempotent operations via idempotency_key
- Supports CREATE, UPDATE, DELETE operations

**Request**:
```json
{
  "device_id": "web-uuid",
  "changes": [
    {
      "id": "local-uuid",
      "entity_type": "medication",
      "operation": "CREATE",
      "data": {...},
      "idempotency_key": "hash",
      "timestamp": "2026-04-19T..."
    }
  ],
  "last_sync": "2026-04-19T..."
}
```

**Response**:
```json
{
  "success": [{"local_id": "uuid", "server_id": 123, "version": 1}],
  "conflicts": [{"local_id": "uuid", "reason": "...", "server_data": {...}}],
  "new_data": [...],
  "last_sync": "2026-04-19T..."
}
```

## How It Works

### Offline Flow
1. User is offline, adds a medication
2. API client creates optimistic UI update
3. Request is queued in IndexedDB
4. Toast notifies user: "Queued - will sync when online"

### Sync Flow
1. User comes online
2. Service worker triggers sync (every 30 seconds or manual)
3. API client sends all queued changes to `/api/v1/sync`
4. Server processes changes with conflict resolution
5. Client removes synced changes from queue
6. Stores are updated with server data

### Caching Strategy
| Entity | Cache TTL | Reason |
|--------|-----------|--------|
| Family Members | 60 min | Change infrequently |
| Medications | 30 min | More frequent updates |
| Appointments | 6 hours | Change less often |
| Lab Results | 7 days | Historical data |
| AI Recommendations | 1 day | Regenerated daily |

## Next Steps: Integration with Existing Frontend

The following files still need migration from old API calls to use shared packages:

### High Priority
- [ ] `frontend/src/pages/*.jsx` - Update to use `@med-assistant/api-client` hooks
- [ ] `frontend/src/api/*.js` - Consider deprecating in favor of shared client
- [ ] Vite config - Add service worker plugin

### Integration Example
```typescript
// OLD
import { axios } from './api/client'
const response = await axios.get('/api/v1/family')

// NEW
import { getFamilyMembers } from '@med-assistant/api-client'
import { useFamilyStore } from '@med-assistant/store'

const members = await getFamilyMembers()
useFamilyStore.getState().setMembers(members)
```

## Testing Phase 1

### Manual Testing
1. **Offline Mode**:
   - Open DevTools → Network → "Offline"
   - Try adding a medication
   - Verify toast shows "Queued"
   - Go back online
   - Verify medication synced to server

2. **Background Sync**:
   - Queue multiple changes offline
   - Go online
   - Verify all changes sync within 30 seconds

3. **Cache**:
   - Load family members
   - Go offline
   - Navigate away and back
   - Verify data still visible

### Automated Testing (Phase 2)
- [ ] Unit tests for API client
- [ ] Unit tests for stores
- [ ] Integration tests for offline flow
- [ ] E2E tests for sync across multiple tabs

## Technical Decisions

### Why Zustand over Redux?
- Simpler for multi-platform (no providers needed)
- Works in React, React Native, vanilla JS
- Better for Phase 2/3 mobile integration

### Why IndexedDB over localStorage?
- Supports large data (>5MB vs 5MB limit)
- Better structured queries
- Asynchronous API (no blocking)

### Why Server Authority for Conflicts?
- Medical app = safety first
- User can always retry with latest server data
- Prevents data corruption

## Database Migration (If Needed)

For Phase 2 mobile sync, add audit logging:

```python
# backend/alembic/versions/001_add_audit_logs.py
def upgrade():
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer),
        sa.Column('user_id', sa.Integer),
        sa.Column('action', sa.String),  # READ, CREATE, UPDATE, DELETE
        sa.Column('entity_type', sa.String),
        sa.Column('device_id', sa.String),
        sa.Column('timestamp', sa.DateTime),
        # Indexes for compliance reporting
    )
```

## Deployment Checklist
- [ ] Run `pnpm install` in root
- [ ] Test `npm run build` in frontend
- [ ] Test `npm run dev` locally
- [ ] Verify service worker loads
- [ ] Test offline functionality
- [ ] Deploy backend with sync endpoint
- [ ] Monitor sync success rate

## Known Limitations (Phase 1)
- [ ] No CRDT conflict resolution (server wins)
- [ ] No real-time sync (30 sec polling)
- [ ] No device tracking/multi-device UI
- [ ] AI recommendations not cached locally
- [ ] No notification for new server data

These will be addressed in Phase 2/3.
