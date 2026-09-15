# Project Management Tool (Jira Clone) - Project Plan

## Tech Stack
- **Frontend:** React 18+, TypeScript, Tailwind CSS, Redux Toolkit
- **Backend:** Node.js, Express.js, TypeScript
- **Primary DB:** PostgreSQL (relational data)
- **Secondary DB:** MongoDB (activity logs, audit trails)
- **Real-time:** Socket.io (WebSockets)

---

## Phase 1: Foundation (Weeks 1-2)

### 1.1 Project Setup
```
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/           # Redux Toolkit
│   │   ├── services/        # API calls
│   │   └── utils/
│   └── package.json
├── server/                  # Node.js backend
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── docker-compose.yml
└── .env
```

### 1.2 Database Schema (PostgreSQL)
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    key VARCHAR(10) UNIQUE NOT NULL,  -- e.g., "PROJ"
    description TEXT,
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Issues table
CREATE TABLE issues (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50),  -- bug, feature, task, story
    status VARCHAR(50), -- todo, in_progress, in_review, done
    priority VARCHAR(20), -- low, medium, high, critical
    assignee_id UUID REFERENCES users(id),
    reporter_id UUID REFERENCES users(id),
    sprint_id UUID,
    story_points INTEGER,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sprints table
CREATE TABLE sprints (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(20) -- planned, active, completed
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY,
    issue_id UUID REFERENCES issues(id),
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Project members
CREATE TABLE project_members (
    project_id UUID REFERENCES projects(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(20), -- admin, member, viewer
    PRIMARY KEY (project_id, user_id)
);
```

---

## Phase 2: Backend API (Weeks 2-4)

### 2.1 Authentication
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- POST `/api/auth/refresh`
- Password hashing (bcrypt)
- JWT tokens (access + refresh)

### 2.2 Projects
- GET `/api/projects`
- POST `/api/projects`
- GET `/api/projects/:id`
- PUT `/api/projects/:id`
- DELETE `/api/projects/:id`
- POST `/api/projects/:id/members`
- GET `/api/projects/:id/members`

### 2.3 Issues
- GET `/api/projects/:projectId/issues`
- POST `/api/projects/:projectId/issues`
- GET `/api/issues/:id`
- PUT `/api/issues/:id`
- DELETE `/api/issues/:id`
- PUT `/api/issues/:id/status` (drag-drop)
- POST `/api/issues/:id/assign`
- GET `/api/issues/:id/comments`
- POST `/api/issues/:id/comments`

### 2.4 Sprints
- GET `/api/projects/:projectId/sprints`
- POST `/api/projects/:projectId/sprints`
- PUT `/api/sprints/:id`
- POST `/api/sprints/:id/start`
- POST `/api/sprints/:id/complete`

### 2.5 Search & Filters
- GET `/api/search/issues?query=&status=&priority=&assignee=`

### 2.6 Real-time (Socket.io)
- Issue updated notifications
- Board live updates
- @mention notifications

---

## Phase 3: Frontend - Core UI (Weeks 3-6)

### 3.1 Pages
| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Email + password |
| Register | `/register` | Create account |
| Dashboard | `/` | Overview, assigned issues |
| Projects | `/projects` | List all projects |
| Board | `/projects/:id/board` | Kanban board |
| Backlog | `/projects/:id/backlog` | Issue list view |
| Sprint | `/projects/:id/sprint/:sprintId` | Sprint view |
| Issue | `/issues/:id` | Issue detail modal |
| Settings | `/projects/:id/settings` | Project settings |

### 3.2 Components
```
├── Layout
│   ├── Sidebar
│   ├── Header
│   └── Breadcrumb
├── Auth
│   ├── LoginForm
│   └── RegisterForm
├── Board
│   ├── KanbanBoard
│   ├── Column
│   ├── IssueCard
│   └── DragDropWrapper (react-beautiful-dnd)
├── Issue
│   ├── IssueModal
│   ├── IssueForm
│   ├── CommentSection
│   └── IssueFilters
├── Sprint
│   ├── SprintBoard
│   └── SprintForm
└── Common
    ├── Button
    ├── Modal
    ├── Dropdown
    └── Avatar
```

### 3.3 State Management (Redux Toolkit)
```typescript
// slices/
- authSlice.ts      // user, token, login/logout
- projectSlice.ts   // projects, currentProject
- issueSlice.ts     // issues, filters
- sprintSlice.ts    // sprints, activeSprint
- uiSlice.ts        // modals, sidebar, theme
```

---

## Phase 4: Advanced Features (Weeks 5-8)

### 4.1 Drag & Drop Kanban
- Move issues between columns
- Reorder within columns
- Optimistic UI updates
- Persist to backend

### 4.2 Sprint Management
- Create/start/complete sprints
- Sprint planning (assign issues)
- Sprint velocity tracking
- Burndown chart

### 4.3 Search & Filtering
- Full-text search (PostgreSQL)
- Filter by: status, priority, type, assignee
- Save filter presets

### 4.4 Notifications
- In-app notifications
- Email notifications (optional)
- WebSocket real-time updates

### 4.5 Activity Log (MongoDB)
```javascript
{
    _id: ObjectId,
    projectId: UUID,
    issueId: UUID,
    userId: UUID,
    action: "created" | "updated" | "commented",
    changes: { field, oldValue, newValue },
    timestamp: Date
}
```

---

## Phase 5: Polish & Deploy (Weeks 7-10)

### 5.1 Performance
- Pagination for large lists
- Lazy loading components
- Image optimization

### 5.2 Testing
- Unit tests: Jest (backend)
- Component tests: React Testing Library
- E2E tests: Cypress
- API tests: Supertest

### 5.3 Deployment
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: project_manager
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    
  mongodb:
    image: mongo:7
    
  api:
    build: ./server
    ports:
      - "3001:3001"
    
  client:
    build: ./client
    ports:
      - "3000:3000"
```

### 5.4 CI/CD
- GitHub Actions for testing
- Docker for containerization
- Deploy to AWS/Vercel/Railway

---

## Summary Timeline

| Week | Milestone |
|------|-----------|
| 1-2 | Project setup, DB schema, auth |
| 3-4 | Backend API complete |
| 5-6 | Frontend core pages |
| 7-8 | Drag-drop, sprints, search |
| 9-10 | Testing, polish, deploy |

## Key Libraries

**Backend:**
- `express` - HTTP server
- `prisma` - ORM (PostgreSQL)
- `mongoose` - MongoDB ODM (activity logs)
- `bcrypt` - password hashing
- `jsonwebtoken` - auth
- `socket.io` - real-time
- `pg` - PostgreSQL client

**Frontend:**
- `react` + `vite`
- `@reduxjs/toolkit` + `react-redux`
- `react-router-dom` - routing
- `@hello-pangea/dnd` - drag & drop
- `axios` - HTTP client
- `tailwindcss` - styling
- `react-query` or SWR - data fetching
