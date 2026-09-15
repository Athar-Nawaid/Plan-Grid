# Plan Grid — Project & Architecture Interview Guide

> Use this to defend the tech choices you made, explain how the system works end‑to‑end,
> and handle the "why did you do it this way" questions in an interview.
> Everything below is grounded in the actual codebase (`./client`, `./server`).

---

## 1. What the product is

**Plan Grid** is a small Jira‑style project management tool. A user creates **projects**, adds
**members**, and works in two views:

- **Kanban Board** (`/projects/:projectId/board`) — drag‑drop issues between status columns,
  filter/search, add issues, comment on them, view recent activity + realtime updates.
- **Backlog & Sprints** (`/projects/:projectId/backlog`) — create/schedule sprints, manage a
  backlog, drag/assign issues into sprints, start & complete sprints.

The headline feature is **real‑time collaboration**: when one user creates/updates/relocates
an issue, every other open board for that project updates live.

---

## 2. The stack

| Layer | Choice | Why |
|-------|--------|-----|
| Language | **TypeScript** end‑to‑end | One language across client/server; shared mental model; safer refactors |
| Client framework | **React 18 + Vite** | fast HMR, small bundle, huge ecosystem |
| Client state | **Redux Toolkit (RTK) + Redux slices** | predictable, centralised stores; RTK's `createAsyncThunk` removes boilerplate for a complex cache like issues/sprints |
| Client UI | **Tailwind CSS** | utility‑first lets me build a polished dark board UI without hand‑writing CSS files |
| Client drag‑drop | `@hello-pangea/dnd` | maintained fork of `react-beautiful-dnd`; fluent, accessible, board‑friendly API |
| Real‑time client | `socket.io-client` | pairs naturally with the Socket.IO server; automatic reconnection, rooms |
| Server framework | **Express** | minimal, well‑understood, easy to layer middleware (auth, validation, async handling) |
| ORM | **Prisma** | type‑safe queries + generated client; schema as source of truth; easy migrations |
| Relational DB | **PostgreSQL** | ACID transactions (critical for sprint/issue position swaps), relational integrity |
| Activity log DB | **MongoDB (Mongoose)** | it's an append‑only audit/activity stream — see §8 for the rationale |
| Auth | **JWT + bcrypt** | stateless session, no server session store; bcrypt hashes passwords |
| Real‑time server | **Socket.IO** | rooms + namespaced events make per‑project broadcast trivial |
| Validation | **Zod** on the server | parse/safeParse at the boundary keeps bad input out of the DB and Prisma |

**Why TypeScript + Prisma on Postgres:** the domain is inherently relational (project → issues →
sprints → members → comments, with references between assignees/reporters). Postgres gives
guaranteed referential integrity and transactions; Prisma turns those relations into typed,
autocompleted queries with almost no hand‑written SQL.

---

## 3. Folder layout (what lives where)

```
server/src
├── index.ts            # Express app + Socket.IO bootstrap, JWT socket auth, rooms
├── config/             # prisma (Postgres) + mongo (Mongoose) connections
├── controllers/        # route handlers (auth, project, issue, sprint, activity)
├── middleware/         # authenticate (JWT), project access/role checks
├── models/             # Mongoose models (ActivityLog — Mongo side)
├── routes/             # express Router wiring per resource
├── services/           # realtimeService (emitProjectChange/emitNewComment), activityService
├── utils/              # asyncHandler, jwt (verify/sign), validation schemas
└── types/              # shared Express request augmentation (userId, userName …)

client/src
├── components/         # board (KanbanBoard, IssueCard), issue (IssueModal), common UI
├── pages/              # Board, Backlog, Projects, Auth pages
├── store/slices/       # issueSlice, sprintSlice, projectSlice, authSlice, uiSlice
├── hooks/              # useProjectRealtime — socket→dispatch glue
├── services/           # axios instance + typed API wrappers, socket client shim
└── types/              # shared client types (Issue, Sprint, Comment …)
```

**Deliberate choice to call out:** the API domain is split across folder concerns but *not* across
projects — the server is a single Node/TS service that owns both Postgres (via Prisma) and Mongo
(via Mongoose). The Mongo only stores the audit/activity feed, kept deliberately separate from the
transactional relational tables.

---

## 4. Data model (Prisma schema digest)

```
User       1──*─ ProjectMember *──1 Project(owner) 1──* Issue 1──* Comment
Project    1──* Sprint           1──* Issue
Issue      ── assignee/reporter → User
```

- **Project / ProjectMember** — members join with a `role` (ADMIN / MEMBER / VIEWER), which drives
  the RBAC middleware on who can mutate what.
- **Issue** — `type` (BUG/FEATURE/TASK/STORY), `status` (TODO→DONE), `priority`, `storyPoints`,
  `position` (**per‑column ordering key**), `assigneeId`, `sprintId`, `dueDate`.
- **Sprint** — `status` (PLANNED/ACTIVE/COMPLETED), `startDate`/`endDate`, issues attached.
- **Comment** — bound to an issue + author.

Key indexing note: `@@index([projectId, status])` on Issue supports the board's grouped query, and
`position` is used to keep stable order inside a column.

---

## 5. The interesting parts — explainable, defensible

### 5.1 Real‑time collaboration (the flagship)

**Server side**
- `index.ts` creates a Socket.IO server. On every socket connection a **JWT middleware** runs:
  the handshake carries the auth token, we `verifyToken`, and attach `userId`/`userName` to the
  socket.
- Clients call `socket.emit("joinProject", projectId)` which does `socket.join("project:"+projectId)`
  — so each connection is a member of exactly the rooms it cares about. `leaveProject` removes it.
- `services/realtimeService.ts` holds `ioRef` (injected via `initRealtime(io)` in `index.ts`).
  Mutations fan out through two helpers:
  - `emitProjectChange(projectId)` → emits **`project:changed`** to room `project:<id>`
  - `emitNewComment(...)` → emits **`comment:created`**

**Where the events fire (verified in code):**
- `createIssue` → `emitProjectChange(projectId)` after creating + logging activity
- `createComment` → `emitNewComment(issue.projectId, issueId, comment)` + comment activity log

**Client side**
- `services/socket.ts` exposes a singleton `getSocket()` (auth token from `localStorage`), plus
  `joinProject`/`leaveProject` helpers. The axios layer sends the same token as `Authorization:
  Bearer …` for REST.
- `hooks/useProjectRealtime.ts` is the glue: on mount it joins the project room ringside, subscribes
  to `project:changed`, and on that event dispatches `fetchIssues` + `fetchSprints` — so the board
  refetches the freshest server state. Cleanup leaves the room and unsubscribes.
- Both **BoardPage.tsx** and **BacklogPage.tsx** mount this hook.

**Why socket push + refetch instead of pushing full issue objects?**
- Pushing the *event* (not the full payload) means the server stays decoupled from the client's
  Redux shape.
- Refetching after a change keeps a single source of truth (the DB) and automatically picks up any
  filters/search the receiving user has active — instead of us having to reconcile a partial
  payload against local filters. Trade‑off: slightly more traffic than diffing, but the board lists
  are small and it eliminates an entire class of consistency bugs.

**Why rooms (Socket.IO) rather than plain WebSocket broadcast?** Each project is a room. In a
multi‑project SaaS this is what keeps traffic scoped — you never leak/relay a change to a user who
isn't looking at that project wishlist.

### 5.2 JWT auth + the single-token flow

- **Register/login** (`authController`) — Zod‑validated, `bcrypt.hash`, token
  `sign({ sub: userId, name, email })`, returned to the client.
- Client stores the token in `localStorage` (`pm_token`); the axios request interceptor attaches
  `Bearer` header; the **response interceptor** clears it and kicks to `/login` on any 401.
- Server `middleware/auth.ts`: requires `Authorization: Bearer`, `verifyToken`, augments `req` with
  `userId`/`userName`/`userEmail`.
- The **same token that authenticates REST also authenticates the socket handshake**, so there's one
  credential to rotate/protect and no separate session store to keep in sync.

**Defensible answer to "localStorage vs cookies":** localStorage avoids CSRF surface that cookie‑based
auth has Temple and is simplest for a demo. Acknowledge the XSS trade‑off and say: for production I'd
move to httpOnly/same‑site cookies with the token, or a short‑lived access token + rotating refresh
token.

### 5.3 RBAC on project mutations

`middleware/` checks the caller's role in `project_members` (ADMIN can manage members/sprints; MEMBER
mutates issues; VIEWER read‑only). This keeps authorization next to routing and cheap to reason about.

### 5.4 Activity / audit trail (the much‑questioned dual‑DB call)

- A `logActivity(...)` service writes an **ActivityLog** row (projectId, issueId, actor, action,
  entityType, changes with old→new values).
- REST: `/api/activity/projects/:projectId/activity` feeds the "Recent activity" panel; comments
  activity exists per issue.
- **Postgres stores the domain; MongoDB stores the audit stream — why split?**
  - The activity feed is **append‑only, write‑heavy, never updated** and is *denormalized on
    purpose* (we snapshot `actorName` and change values so history is stable even if the entity
    changes later). That's exactly what a document store is good at — no joins, no transactions
    needed, trivially horizontally scalable.
  - Keeping it out of Postgres means board reads (the hot path) never contend with the audit
    write volume.
  - **Honest trade‑off to volunteer:** two stores = two latencies/connection pools/deployments; a
    single Postgres table would have been simpler. In a real system I'd benchmark; the split is
    justified here because the workload profile genuinely differs (transactional vs append‑only).

### 5.5 Optimistic + confirmable updates

On the board, drag‑drop (`@hello-pangea/dnd` → `onDragEnd`) dispatches `setIssueStatus` using an
optimistic column reorder (local splice + next `position`), then the server transaction swaps
positions atomically (`updateIssueStatus` uses a `$transaction` to swap the displaced issue). Status
changes only log activity when the status actually changed — so the audit trail isn't polluted by
no‑op drags.

---

## 6. One issue, end to end (talk through this)

1. **Create:** BoardPage → modal submits `createIssue` thunk → `api.post /api/projects/:pid/issues`
   → controller Zod‑parses, computes `max position + 1` for the column, `prisma.issue.create`, wraps
   in activity log, `res.status(201).json(issue)`, then
   **`emitProjectChange(projectId)`**.
2. **Push:** Socket.IO emits `project:changed` to room `project:<pid>`.
3. **Refetch:** every joined client (including the creator's other tab) gets the event →
   `useProjectRealtime` dispatches `fetchIssues`+`fetchSprints` → Redux slices update → Board /
   Backlog re‑render.
4. **Drag:** `KanbanBoard` reorders optimistically → `setIssueStatus` → server transaction swaps
   positions → `res.json(issue)`; other clients see it via the same refetch.
5. **Comment:** `createComment` persists, logs activity, `emitNewComment` pushes `comment:created`.

The REST and socket paths share the **same token, same validation, same service layer**, which is a
clean story to tell.

---

## 7. Things to pre‑empt (known gaps / future work)

- **Comment realtime is emit‑only today:** the server pushes `comment:created`, but the client
  hook currently consumes `project:changed`. If asked, say: the DQL wiring is there server‑side and
  the next step is a `comment:created` listener that appends to the open issue modal without a full
  refetch.
- **`deleteIssue`/`deleteProject` don't push realtime yet** — a `project:changed` emit after deletes
  is the immediate finishing touch for parity.
- **Position swaps are per‑project/column and could live on a shared position manager** if list
  sizes get large; today's `max(position)+1` + `$transaction` swap is correct and simple.
- **Offline conflict resolution** is not implemented — last‑write‑wins via refetch. Fine for a demo,
  always call it out honestly.

---

## 8. One‑liners for "Why X?"

- **Why Socket.IO over raw WebSocket?** Namespaced rooms + built‑in reconnection/fallback, JWT
  handshake auth, tiny server code, and the client lib is already in the stack.
- **Why Redux Toolkit?** Predictable store for a cache‑heavy domain; `createAsyncThunk` gives
  pending/fulfilled/rejected lifecycle out of the box; slices keep related state + actions together.
- **Why Prisma?** Generated, type‑safe queries and a single declarative schema that both drives
  migrations and the client‑facing docs.
- **Why PostgreSQL?** The domain is relational with real foreign‑key invariants (positions, statuses,
  membership) and needs transactions for swaps — a transactional RDBMS is the right tool.
- **Why MongoDB for activity?** An append‑only audit stream is a document workload; separating it
  protects the hot relational path and matches the data's shape.
- **Why Tailwind?** Fast iteration on a dark, dense UI; no context switching to CSS files; purge on
  build keeps the bundle lean.
- **Why `@hello-pangea/dnd`?** The maintained RBD fork; its droppable/draggable model maps 1:1 to a
  kanban column × issue model and supports keyboard + touch out of the box.

---

## 9. Very likely interview questions + short answers

**Q: How do two users see the same board update live?**
The mutating controller emits `project:changed` to the Socket.IO room for that project; every client
in the room (via `useProjectRealtime`) refetches issues/sprints and Redux re‑renders. The DB stays
the source of truth.

**Q: Why refetch instead of pushing the payload?**
Simplest correct approach — respects each user's active filters, avoids partial‑update reconciliation
bugs thanks to a typed store. I push the *event*, not the entity, so server and client stay decoupled.

**Q: Feature, if you had a week?**
Turn the emit‑only `comment:created` into a real append path, add optimistic comment post with
rollback, and emit `project:changed` on deletes for parityhare.

**Q: Weakest point?**
LocalStorage JWT (XSS) and last‑write‑wins conflict handling. I'd move to httpOnly cookies
or short‑lived+refresh tokens and add per‑field conflict detection for concurrent edits.

**Q: What if you're the only engineer?**
That's the point of the split: Postgres/Prisma keeps domain code boring and type‑safe, Socket.IO +
room model keeps realtime small, and the monorepo keeps one deploy, one token story, one language.

---

## 10. Handy commands

```bash
# server
cd server
npm run dev          # tsx watch
npm run build        # tsc
npx prisma migrate dev   # schema → DB

# client
cd client
npm run dev          # vite
npm run build        # tsc --noEmit && vite build
```
