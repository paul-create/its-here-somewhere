# It's Here Somewhere - Business Case & Technical Architecture

**App Name:** It's Here Somewhere  
**Tagline:** Stop searching. Start knowing.  
**Last Updated**: 20 September 2026 | **Owner**: Paul Francis

---

## 1. Business Case

### The Problem

When Paul needs something, he goes to where he last left it. If it's not there, he asks his wife. If she's moved it (for tidiness), she often can't remember where. Paul spends hours searching the home. When he finally finds it (usually in the loft or garage), the friction of not having a shared record becomes clear.

The real cost isn't just the search time. It's the compounding friction:
- Paul has repurchased items multiple times because searching was slower than ordering
- Arguments are avoided by simply not pressing the issue
- The home's carefully organised storage (segmented loft areas) remains completely uncatalogued
- There's no shared accountability or visibility - just blame and frustration

### Why It Matters

This isn't a technology problem; it's a household coordination problem. The root cause is a gap between two incompatible mental models:
- **Paul's model**: items visible and accessible in their original locations (so he can find and use them)
- **Wife's model**: clutter-free environment with items tidied away

A logging and search app bridges this gap. It doesn't change either person's behaviour; it removes blame from the equation and replaces it with shared knowledge. Instead of "she moved it and won't tell me where", it becomes "the app knows where it is."

The discipline of logging-as-you-move turns a household friction point into a process both can work with.

### MVP Value Proposition

Version 1 solves the data problem first, before building the search features.

**What v1 delivers:**
- Both Paul and his wife can catalogue items with a photo and basic metadata
- Photos are automatically tagged with semantic information (using Claude API or AWS Rekognition)
- Users can refine, add, or remove tags - building a corpus of well-described household items
- Data lives in the cloud and syncs across two phones

**Why this matters for v1:**
By the time v2 ships (with full search, movement history, and reports), Paul will have:
1. A corpus of catalogued items with accurate tags and photos
2. An established logging discipline between him and his wife
3. Proof that the concept works before investing in complex search features

### Target Users

- **Primary (v1)**: Paul and his wife (two household users)
- **Future (post-launch)**: Other households seeking to organise shared spaces and resolve similar domestic friction

### Success Metrics for v1 Launch

- Catalogue at least 50-100 items from Loft - Paint Area with photos and auto-generated tags
- Both users can create items and edit tags on mobile without friction
- Photo auto-tagging achieves >80% accuracy on common household items
- Data persists in cloud and syncs reliably across two phones within acceptable delay
- Wife actively participates in logging (not just Paul)

---

## 2. Technical Architecture

### Technology Stack Overview

Here's what we're building and why:

**Frontend**: React Native (one codebase, iOS and Android)
- Why: You want to build this yourself, and one codebase saves you from maintaining iOS and Android separately
- Learning curve: moderate, but you'll ship faster than native

**Backend**: Node.js with Express (API server)
- Why: Fast to build, good for real-time sync, plays well with all the tools we'll use

**Database**: PostgreSQL (cloud-hosted)
- Why: Structured data (items, locations, users), ACID guarantees matter for data consistency, excellent support for images and metadata

**Cloud Provider**: AWS (you mentioned comfort with Azure but wanting to learn AWS)
- Why: Strong ecosystem for mobile apps, good pricing, solid documentation

**Photo Storage**: Amazon S3 (AWS file storage)
- Why: Cheap, scalable, integrates seamlessly with your backend

**Photo Tagging**: Claude API (via your Platform token) or AWS Rekognition (your choice)
- Why: Claude API is cheaper if you have credits; Rekognition is simpler AWS integration; we'll build flexibility to switch

**Authentication**: AWS Cognito
- Why: Handles user signup, login, and multi-device sync without you building it from scratch

**Real-time Sync**: AWS AppSync (GraphQL) or simple REST polling
- Why: Keeps both phones in sync when items are logged; for v1, simple polling is fine

### Data Model

```
Users
- id (unique)
- email
- name
- created_at

Items
- id (unique)
- user_id (who created it)
- category_id
- name
- description
- quantity (optional)
- dimensions (optional)
- is_private (boolean)
- created_at
- updated_at

Photos
- id (unique)
- item_id
- s3_key (where it's stored in S3)
- uploaded_by (user_id)
- created_at

Tags
- id (unique)
- photo_id
- tag_name
- is_auto_generated (boolean - to distinguish user tags from AI tags)
- created_at

Locations
- id (unique)
- user_id (owner of the location hierarchy)
- name (e.g., "Loft")
- parent_location_id (null for top-level; otherwise points to parent)
- created_at

ItemLocations (tracks where items are stored)
- id (unique)
- item_id
- location_id
- stored_at (timestamp when it was moved there)
- moved_by (user_id)
- created_at

Categories
- id (unique)
- user_id
- name (e.g., "Tools", "Garden")
- created_at
```

### AWS Explained (Beginner-Friendly)

You mentioned comfort with Azure but you're new to AWS. Here's the mental model:

**Azure == AWS, different names:**
- Azure App Service == AWS EC2 or App Runner (where your server runs)
- Azure Blob Storage == AWS S3 (where you store files)
- Azure SQL Database == AWS RDS (where your database lives)
- Azure AD == AWS Cognito (handles user logins)
- Azure Cosmos DB == AWS DynamoDB (NoSQL, if you need it - you probably don't for this)

**AWS Specific for this Project:**

1. **RDS (Relational Database Service)**: PostgreSQL runs here
   - Think of it as "managed database" - AWS handles backups, updates, scaling
   - You just provide connection details and start querying

2. **S3 (Simple Storage Service)**: Photo storage
   - Think of it as "infinite folder in the cloud"
   - You upload photos here, get back a URL, store the URL in your database
   - Dirt cheap for file storage

3. **Cognito**: User authentication
   - Handles "sign up", "log in", "reset password"
   - Returns a token your app uses for every request
   - You don't build login screens from scratch; Cognito handles it

4. **EC2 or App Runner**: Your Node.js backend
   - EC2 = full control, more to configure
   - App Runner = simpler, less to configure (better for you right now)
   - Runs your API, connects to your database, handles photo uploads to S3

5. **Rekognition or Claude API**: Photo tagging
   - Send a photo, get back tags
   - We'll build this as a microservice your backend calls

**Pricing Reality:**
- For two-user household app: roughly £10-20/month initially
- Photos on S3: £0.023 per GB/month (extremely cheap)
- Database: £10-15/month for smallest instance
- API calls: depends on tagging service choice, but <£5/month for light usage

### Deployment: GitHub to AWS

Here's the flow:
1. You push code to GitHub
2. GitHub Actions (free, built into GitHub) runs tests
3. If tests pass, it builds and deploys to AWS App Runner or EC2
4. Your app is live

We'll set this up so you can `git push` and that's it - deployment is automatic.

### Architecture Diagram (Conceptual)

```
┌─────────────┐
│  Paul's     │
│  Phone      │
│(React Native)
└──────┬──────┘
       │
       │ HTTPS
       ▼
┌──────────────────────────────────────┐
│     AWS (your backend lives here)     │
│                                      │
│  ┌──────────────────────────────────┐│
│  │  App Runner / EC2                ││
│  │  (Node.js API server)            ││
│  │  - Handle login                  ││
│  │  - Store items                   ││
│  │  - Accept photo uploads          ││
│  │  - Sync data to both phones      ││
│  └──────────┬───────────────────────┘│
│             │                        │
│  ┌──────────▼───────────────────────┐│
│  │  RDS (PostgreSQL database)       ││
│  │  - Users, items, locations       ││
│  │  - All structured data           ││
│  └──────────────────────────────────┘│
│                                      │
│  ┌──────────────────────────────────┐│
│  │  S3 (photo storage)              ││
│  │  - Raw photos from both phones   ││
│  └──────────────────────────────────┘│
│                                      │
│  ┌──────────────────────────────────┐│
│  │  Claude API or Rekognition       ││
│  │  - Generate tags from photos     ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
       ▲                         │
       │ sync data               │ upload photos
       │                         ▼
┌──────┴──────┐        ┌─────────────┐
│ Wife's      │        │  S3 Storage │
│ Phone       │        └─────────────┘
└─────────────┘
```

### Security & Privacy Notes

- Photos stored in S3 with encryption at rest
- User data in RDS encrypted in transit (HTTPS only)
- Private items marked at database level (won't be returned in shared queries)
- Each user authenticated via Cognito (wife and Paul have separate logins)
- No data shared between households (separate database records per household)

---

## 3. Execution Roadmap

**Phase 1: Foundation (Weeks 1-2)**
- AWS account setup, IAM roles, security basics
- PostgreSQL RDS instance created
- Basic Node.js backend scaffolding
- GitHub Actions CI/CD pipeline set up

**Phase 2: Core MVP Backend (Weeks 2-4)**
- User authentication (Cognito integration)
- Item creation and storage
- Photo upload to S3
- Photo tagging integration (Claude or Rekognition)
- Tag management (edit, remove, accept auto-generated tags)

**Phase 3: Mobile Frontend (Weeks 4-6)**
- React Native project setup
- Login screen
- Item creation form (name, category, description, quantity, dimensions)
- Photo capture and upload
- Tag review and editing
- Location selection and hierarchy

**Phase 4: Sync & Cloud Integration (Weeks 6-7)**
- API calls from mobile to backend
- Real-time sync between two phones
- Offline handling (cache on phone, sync when online)
- Error handling and retries

**Phase 5: Testing & Refinement (Week 8)**
- End-to-end testing with both phones
- Performance tuning
- Bug fixes
- Cataloguing sprint with wife (first location: Loft - Paint Area)

**Phase 6: Launch & Post-MVP (Week 9+)**
- Soft launch with just Paul and wife
- Gather feedback
- Plan v2 features (search, movement history, reports)

---

## Questions for Paul

Before I detail the daily sprint plan, I need to confirm:

1. **Development Environment**: Are you planning to code on macOS, Windows, or Linux? (Affects some tooling choices)
2. **Daily Bandwidth**: How many hours/day can you realistically dedicate to this? (Affects sprint sizing)
3. **Learning Style**: Do you want me to explain AWS + Node.js concepts as we build, or prefer to focus on the code?
4. **Testing & Quality**: How rigorous do you want the testing? (Unit tests, integration tests, or just manual testing on the phones?)
5. **Timeline**: Is 8-9 weeks realistic, or do you need faster/slower?
