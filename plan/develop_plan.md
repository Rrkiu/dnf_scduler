# DNF Scheduler Web Application – Development Plan

## 1. Objective

This project aims to rebuild an existing Google Apps Script (GAS)-based DNF scheduler system into a scalable, web-based application.

The new system will:

* Replace Google Sheets as the primary data store
* Support multi-user access
* Provide structured data management (normalized DB)
* Enable future extensibility (automation, optimization, recommendation)

---

## 2. System Architecture

### 2.1 Tech Stack

| Layer    | Technology            |
| -------- | --------------------- |
| Frontend | Next.js (App Router)  |
| Backend  | Supabase (BaaS)       |
| Database | PostgreSQL (Supabase) |
| Auth     | Supabase Auth         |
| Hosting  | Vercel (Hobby Plan)   |

---

### 2.2 High-Level Architecture

```
[ User ]
   ↓
[ Next.js Frontend (Vercel) ]
   ↓
[ Supabase Client SDK ]
   ↓
[ PostgreSQL Database ]
```

Optional (future):

```
[ Edge Functions / API Routes ]
   ↓
[ External Data Source (Dundam) ]
```

---

## 3. Core Features

### 3.1 Data Collection

* Input adventure name
* Fetch character data from Dundam
* Parse and normalize data
* Store/update in database

### 3.2 Character Management

* View character list
* Filter (role, fame, etc.)
* Sort (damage, buff power)
* Update / refresh

### 3.3 Schedule Management

* Create multiple schedules
* Assign characters to slots
* Maintain slot ordering

### 3.4 Rules / Filtering

* Dealer cut
* Buffer cut
* Candidate filtering

### 3.5 (Future)

* Auto party optimization
* Recommendation engine
* Multi-user collaboration enhancements

---

## 4. Data Model (Normalized Schema)

### 4.1 Tables

#### Adventures

```sql
id (PK)
name (unique)
created_at
```

#### Characters

```sql
id (PK)
adventure_id (FK)
character_name
role (dealer | buffer)
fame
damage
buff_power
updated_at
```

#### Schedules

```sql
id (PK)
name
created_at
```

#### ScheduleSlots

```sql
id (PK)
schedule_id (FK)
position (int)
character_id (FK, nullable)
role
unique(schedule_id, position)
```

#### Rulesets (Optional Future)

```sql
id (PK)
name
dealer_cut
buffer_cut
```

---

## 5. Key Design Decisions

### 5.1 Replace Spreadsheet Logic

GAS combined:

* UI
* Data storage
* Business logic

New system separates:

* UI → React components
* Data → PostgreSQL
* Logic → API / client logic

---

### 5.2 Data Flow Redesign

Old:

```
Sheet → Script → Sheet
```

New:

```
UI → API → DB → UI
```

---

### 5.3 Sync Strategy

Use **on-demand sync**:

* User clicks "Sync"
* Fetch Dundam data
* Update DB

No background crawler initially.

---

## 6. Project Structure

```
dnf-scheduler/
├── app/
│   ├── page.tsx
│   ├── characters/
│   │   └── page.tsx
│   ├── schedules/
│   │   └── page.tsx
│   └── api/
│       └── sync/
│           route.ts
│
├── components/
│   ├── CharacterTable.tsx
│   ├── ScheduleBoard.tsx
│   └── SyncButton.tsx
│
├── lib/
│   ├── supabase.ts
│   ├── db.ts
│   └── dundam-parser.ts
│
├── types/
│   └── index.ts
│
├── .env.local
├── package.json
└── README.md
```

---

## 7. API Design

### 7.1 Sync Characters

**POST /api/sync**

Request:

```json
{
  "adventureName": "example"
}
```

Process:

1. Fetch Dundam HTML
2. Extract character data
3. Normalize fields
4. Upsert into DB

Response:

```json
{
  "success": true,
  "updatedCount": 12
}
```

---

### 7.2 Fetch Characters

Use Supabase client directly:

```ts
supabase.from('characters').select('*')
```

---

### 7.3 Create Schedule

```ts
insert into schedules (name)
```

---

### 7.4 Assign Slot

```ts
insert/update schedule_slots
```

---

## 8. Development Phases

### Phase 1 – Foundation (MVP Core)

* Supabase setup
* DB schema creation
* Basic Next.js app
* Character list page (read-only)
* Manual character insertion

### Phase 2 – CRUD Expansion

* Character CRUD UI
* Schedule creation
* Slot assignment UI

### Phase 3 – Sync Integration

* Dundam parser implementation
* API route (/api/sync)
* Upsert logic

### Phase 4 – Filtering / Rules

* Dealer / buffer cut filters
* Candidate selection UI

### Phase 5 – UX Improvement

* Table interactions
* Sorting / filtering UI
* Loading states

### Phase 6 – Advanced Features (Optional)

* Auto party generation
* Recommendation system
* Realtime updates

---

## 9. Dundam Parsing Strategy

### 9.1 Approach

* Fetch HTML via server-side API
* Extract embedded JSON if available
* Fallback to regex parsing

### 9.2 Output Format

```ts
type Character = {
  name: string
  role: 'dealer' | 'buffer'
  damage?: number
  buffPower?: number
  fame: number
}
```

---

## 10. Deployment Strategy

### 10.1 Development

* Local Next.js server
* Supabase remote DB

### 10.2 Production

* Deploy to Vercel
* Environment variables configured
* Supabase production project

---

## 11. Cost Considerations

Expected usage:

* ≤ 2 users
* ≤ 30 sync requests per week

Conclusion:

* Vercel Hobby → Free
* Supabase Free → Sufficient

No initial cost required.

---

## 12. Risks & Mitigations

| Risk                | Mitigation              |
| ------------------- | ----------------------- |
| Dundam HTML changes | Abstract parser logic   |
| Data inconsistency  | Use upsert logic        |
| Over-fetching       | Use on-demand sync only |
| Schema evolution    | Use migrations          |

---

## 13. Immediate Next Steps

1. Create Supabase project
2. Apply SQL schema
3. Configure `.env.local`
4. Initialize Supabase client
5. Build `/characters` page (read test)
6. Insert test data manually
7. Verify DB integration

---

## 14. Success Criteria

* Characters can be stored and retrieved from DB
* Schedule can be created and edited
* Sync button updates DB correctly
* System works without Google Sheets dependency

---

## 15. Long-Term Vision

Transform into:

* Multi-user raid planning tool
* Automated party optimization engine
* Data-driven gameplay assistant

---
