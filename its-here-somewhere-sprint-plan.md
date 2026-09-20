# It's Here Somewhere - Detailed Daily Sprint Plan
## 4 Hours/Day, Sept 20 - Mid-November

**App Name:** It's Here Somewhere  
**Tagline:** Stop searching. Start knowing.  
**Total Effort:** 120 hours across 30 working days  
**Pace:** 4 hours/day, sustainable  
**Target Launch:** Mid-November (soft launch with Paul + wife)

---

## SPRINT 1: AWS Foundation & Backend Scaffolding
### Sept 20-27 (8 working days = 32 hours)

**Goal:** AWS account ready, PostgreSQL running, Node.js project scaffolded with auth structure.

### Day 1: Sept 20 (Saturday) - AWS Account Setup & IAM
**Time:** 4 hours
**What You'll Do:**
- Create AWS account (free tier)
- Set up IAM user (not root) for development
- Enable MFA on account
- Set up AWS CLI on Windows (follow AWS documentation for Windows)
- Create programmatic access keys for that IAM user

**Deliverable:** AWS CLI configured locally, able to run `aws s3 ls` without error

**Key Concepts:** 
- **IAM (Identity & Access Management)** = "users" in AWS. You create an IAM user for yourself so you don't use the root account. Root = dangerous.
- **Programmatic Access Keys** = username/password for your code. Like a personal token.

**Resources to Have Open:**
- AWS Management Console (console.aws.amazon.com)
- AWS CLI installation guide for Windows
- Notepad++ for storing credentials temporarily (secure later)

---

### Day 2: Sept 21 (Sunday) - PostgreSQL RDS Setup
**Time:** 4 hours
**What You'll Do:**
- Create RDS PostgreSQL database (free tier: db.t3.micro, 20GB storage)
- Set security group to allow inbound on port 5432 from your IP
- Create initial database called `its_here_somewhere`
- Test connection using psql or pgAdmin

**Deliverable:** PostgreSQL instance running, you can connect from Windows

**Key Concepts:**
- **RDS** = "managed database in AWS". AWS handles backups, patches, you just connect.
- **Security Groups** = firewalls. Only let your IP connect.
- **Port 5432** = PostgreSQL's default port (like how HTTP is 80, HTTPS is 443).

**Security Note:** Store RDS credentials in a `.env` file locally; never commit to GitHub.

**Test Command:** 
```
psql -h <your-rds-endpoint> -U postgres -d its_here_somewhere -c "SELECT version();"
```

---

### Day 3: Sept 22 (Monday) - S3 Bucket & Cognito Setup
**Time:** 4 hours
**What You'll Do:**
- Create S3 bucket named `its-here-somewhere-photos-<random-suffix>` (bucket names must be globally unique)
- Enable versioning on bucket (so you can recover old photos if needed)
- Create IAM policy allowing your backend to upload to this bucket
- Set up Cognito User Pool for authentication
  - Create user pool named `its-here-somewhere`
  - Set password policy (minimum 8 chars, no special chars required for MVP)
  - Create app client (this is what your mobile app will use to authenticate)

**Deliverable:** S3 bucket ready, Cognito user pool with app client ID

**Key Concepts:**
- **S3 Bucket** = "folder in the cloud". Store photos here.
- **Versioning** = "keep old versions". If you upload new photo over old one, you can still get the old one.
- **Cognito User Pool** = handles signup/login. You don't build login forms.
- **App Client** = credentials your mobile app uses to talk to Cognito.

**Save These Values** (you'll need them for backend):
```
COGNITO_USER_POOL_ID=<pool-id>
COGNITO_CLIENT_ID=<app-client-id>
COGNITO_REGION=eu-west-1 (or your region)
S3_BUCKET=its-here-somewhere-photos-xxxxx
```

---

### Day 4: Sept 23 (Tuesday) - Node.js Project Scaffolding & Database Schema
**Time:** 4 hours
**What You'll Do:**
- Create Node.js project folder
- Initialize with `npm init -y`
- Install core dependencies:
  ```bash
  npm install express pg aws-sdk dotenv cors uuid
  npm install --save-dev nodemon jest supertest
  ```
- Create `.env` file with your AWS + database credentials
- Create database schema (tables for users, items, photos, tags, locations, categories)
- Run migrations to create tables in PostgreSQL

**Deliverable:** Node.js project structure ready, database schema in place, can start server

**Project Structure:**
```
its-here-somewhere/
├── .env (not in git)
├── .gitignore
├── package.json
├── src/
│   ├── index.js (main entry point)
│   ├── db.js (PostgreSQL connection)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── items.js
│   │   ├── photos.js
│   │   └── tags.js
│   ├── middleware/
│   │   └── auth.js (verify JWT token)
│   └── utils/
│       └── s3.js (upload to S3)
├── tests/
│   └── (will add later)
└── migrations/
    └── 001_initial_schema.sql
```

**Database Schema to Create:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  cognito_user_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  s3_key VARCHAR(500) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  is_auto_generated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(photo_id, tag_name)
);

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  parent_location_id UUID REFERENCES locations(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE item_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id),
  location_id UUID NOT NULL REFERENCES locations(id),
  stored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  moved_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_category_id ON items(category_id);
CREATE INDEX idx_photos_item_id ON photos(item_id);
CREATE INDEX idx_tags_photo_id ON tags(photo_id);
CREATE INDEX idx_locations_user_id ON locations(user_id);
```

**Save to:** `migrations/001_initial_schema.sql`

**Key Concepts:**
- **UUID** = universally unique ID (better than auto-increment for distributed systems)
- **FOREIGN KEY** = links records between tables (item links to user, photo links to item)
- **ON DELETE CASCADE** = if you delete an item, delete its photos too
- **INDEX** = speeds up queries on frequently searched columns

---

### Day 5: Sept 24 (Wednesday) - Express Server & Cognito Auth Middleware
**Time:** 4 hours
**What You'll Do:**
- Create basic Express server (`src/index.js`)
- Set up middleware (CORS, JSON parsing)
- Create auth middleware to verify Cognito JWT tokens
- Test server locally with Postman

**Deliverable:** Server runs on localhost:3000, can verify auth tokens

**Code Template (src/index.js):**
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes (to be added next days)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/photos', require('./routes/photos'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Auth Middleware (src/middleware/auth.js):**
This verifies that the JWT token from Cognito is valid. I'll provide the boilerplate; you'll integrate it into protected routes.

**Test with Postman:** Send GET to `localhost:3000/health` - should get `{ status: 'ok' }`

**Key Concept:**
- **JWT Token** = "signed message from Cognito that proves you're logged in". Your backend checks the signature is valid.

---

### Day 6: Sept 25 (Thursday) - Auth Routes & User Sync
**Time:** 4 hours
**What You'll Do:**
- Create `/api/auth/signup` endpoint (create user in Cognito, then sync to PostgreSQL)
- Create `/api/auth/login` endpoint (return Cognito token)
- Create `/api/auth/me` endpoint (return current user info)
- Create PostgreSQL connection module (`src/db.js`)
- Test endpoints with Postman

**Deliverable:** Auth flow works - can sign up, log in, get user info

**Key Concepts:**
- **Signup:** "Create user in Cognito" + "Create user record in PostgreSQL"
- **Login:** Cognito returns a JWT token; frontend stores it
- **JWT in requests:** Frontend sends token in `Authorization: Bearer <token>` header

---

### Day 7: Sept 26 (Friday) - S3 Photo Upload & Claude/Rekognition Integration Setup
**Time:** 4 hours
**What You'll Do:**
- Create `/api/photos/upload` endpoint that accepts image file
- Upload photo to S3, store S3 URL in database
- Set up Claude API or AWS Rekognition integration (decision point: which one?)
- Create placeholder for auto-tagging (don't run yet, just structure)

**Deliverable:** Can upload photo to S3, get back URL, stored in database

**Claude vs Rekognition Decision:**
- **Claude API:** You have Platform token, cheaper if you have credits. Simple REST call.
- **AWS Rekognition:** Integrated into AWS, no extra costs if you're already on AWS (uses free tier).

**Recommendation for MVP:** Use Claude API (you already have the token). Easy to switch to Rekognition later.

**S3 Upload Logic:**
```javascript
// Generate unique filename
const filename = `${userId}/${Date.now()}-${originalFilename}`;
// Upload to S3
// Save filename to photos table
// Return S3 URL
```

---

### Day 8: Sept 27 (Saturday) - GitHub Setup & CI/CD Pipeline
**Time:** 4 hours
**What You'll Do:**
- Initialize GitHub repo locally
- Create `.gitignore` (exclude `.env`, `node_modules/`)
- Push to GitHub
- Create GitHub Actions workflow for:
  - Run tests on every push
  - Deploy to AWS App Runner on merge to main

**Deliverable:** Code on GitHub, CI/CD pipeline ready (deploys automatically)

**GitHub Actions Template:**
Basic workflow that runs tests. I'll provide the boilerplate.

**Key Concept:**
- **CI/CD** = "Continuous Integration / Continuous Deployment". Every time you push, tests run. If they pass, code deploys automatically.

---

## SPRINT 2: Backend Complete
### Oct 1-7 (7 working days = 28 hours)

**Goal:** All backend endpoints working, photos auto-tagged, database fully functional.

### Day 9: Oct 1 (Tuesday) - Item CRUD Endpoints
**Time:** 4 hours
**What You'll Do:**
- Create POST `/api/items` (create item)
- Create GET `/api/items` (list items for user)
- Create GET `/api/items/:id` (get single item)
- Create PUT `/api/items/:id` (update item)
- Create DELETE `/api/items/:id` (delete item)
- Add auth middleware to all routes (must be logged in)
- Test all with Postman

**Deliverable:** Full CRUD for items working

---

### Day 10: Oct 2 (Wednesday) - Category Management
**Time:** 4 hours
**What You'll Do:**
- Create POST `/api/categories` (create category)
- Create GET `/api/categories` (list categories for user)
- Create PUT `/api/categories/:id` (rename)
- Create DELETE `/api/categories/:id` (delete)
- Add validation (can't delete category if items use it)

**Deliverable:** Category management working

---

### Day 11: Oct 3 (Thursday) - Photo Auto-Tagging (Claude API)
**Time:** 4 hours
**What You'll Do:**
- Integrate Claude API for photo tagging
- When photo uploaded, call Claude Vision API with photo URL
- Claude returns 3+ tags for the photo
- Store tags in database
- Create POST `/api/photos/:id/tags` to let users add/edit/remove tags

**Deliverable:** Photos auto-tagged, users can edit tags

**Claude Vision API Call:**
```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': process.env.CLAUDE_API_KEY,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'url',
              url: photoUrl,
            },
          },
          {
            type: 'text',
            text: 'Generate 3-5 short tags describing this household item. Return only tags, comma-separated.',
          },
        ],
      },
    ],
  }),
});
```

**Key Concept:**
- **Claude Vision** = Claude can "see" images and describe them. Perfect for auto-tagging.

---

### Day 12: Oct 4 (Friday) - Location Hierarchy
**Time:** 4 hours
**What You'll Do:**
- Create POST `/api/locations` (create location, with optional parent)
- Create GET `/api/locations` (get location tree for user)
- Create PUT `/api/locations/:id` (update)
- Create DELETE `/api/locations/:id` (delete)
- Add location hierarchy validation (can't create circular hierarchy)

**Deliverable:** Location hierarchy working (Loft > Loft - Paint Area, etc.)

---

### Day 13: Oct 5 (Saturday) - Item Location Tracking
**Time:** 4 hours
**What You'll Do:**
- Create POST `/api/items/:id/locations` (log item move to new location)
- Create GET `/api/items/:id/history` (get location history for item)
- Add `moved_by` field to track who moved it
- Add timestamp

**Deliverable:** Can log item moves, see history

---

### Day 14: Oct 6 (Sunday) - Search Skeleton & Error Handling
**Time:** 4 hours
**What You'll Do:**
- Create POST `/api/search` endpoint (takes search query, returns items)
- Implement basic text search on item names + tags
- Add comprehensive error handling (user feedback, logging)
- Write unit tests for critical paths (auth, item CRUD, tagging)

**Deliverable:** Search working (basic), error handling solid, tests passing

**Testing Note:** Just unit tests on auth & CRUD. Don't over-engineer.

---

### Day 15: Oct 7 (Monday) - Backend Polish & Deployment
**Time:** 4 hours
**What You'll Do:**
- Fix any bugs found in testing
- Add rate limiting to endpoints (prevent abuse)
- Set environment variables for production
- Deploy backend to AWS App Runner or EC2
- Test deployed backend from Postman

**Deliverable:** Backend live on AWS, accessible from internet

**Key Concept:**
- **Rate Limiting** = "max 100 requests per minute per user". Prevents someone hammering your API.

---

## SPRINT 3: React Native Mobile App
### Oct 8-18 (11 days = 44 hours)

**Goal:** Mobile app that logs in, creates items, uploads photos, edits tags, views inventory.

### Day 16: Oct 8 (Tuesday) - React Native Scaffolding & Navigation
**Time:** 4 hours
**What You'll Do:**
- Install React Native globally on Windows (using Expo - easiest path for beginners)
- Create new project: `npx create-expo-app ItsHereSomewhere`
- Install dependencies: `npm install @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context axios`
- Set up bottom tab navigation (Home, Add Item, Search, Settings)
- Test app on Expo Go (phone app) or Android emulator

**Deliverable:** App runs, navigation works

**Key Concepts:**
- **Expo** = "simplified React Native". Handle all the platform stuff for you.
- **Navigation** = getting between screens. Bottom tabs = pages at bottom.
- **Axios** = HTTP client for calling your backend API.

**Windows-Specific Note:** Use Android emulator or Expo Go app on your actual phone. Easier than iOS on Windows.

---

### Day 17: Oct 9 (Wednesday) - Login Screen
**Time:** 4 hours
**What You'll Do:**
- Create login screen component
- Email + password inputs
- Call `/api/auth/login` endpoint
- Store JWT token in secure storage (use `expo-secure-store`)
- Navigate to home screen on success

**Deliverable:** Can log in, token stored

**Key Concept:**
- **Secure Storage** = don't put JWT in plain text. Use secure storage.

---

### Day 18: Oct 10 (Thursday) - Home Screen & Item List
**Time:** 4 hours
**What You'll Do:**
- Create home screen showing list of items
- Call GET `/api/items` to fetch
- Show item name, category, thumbnail of photo
- Pull-to-refresh functionality
- Add button to go to "Add Item" screen

**Deliverable:** Can see list of items

---

### Day 19: Oct 11 (Friday) - Add Item Form
**Time:** 4 hours
**What You'll Do:**
- Create form screen with fields:
  - Item name
  - Category (dropdown, loads from API)
  - Description
  - Quantity
  - Is Private (toggle)
  - Location (hierarchical dropdown)
- Submit button calls POST `/api/items`

**Deliverable:** Can create items from mobile

---

### Day 20: Oct 12 (Saturday) - Photo Capture & Upload
**Time:** 4 hours
**What You'll Do:**
- Integrate camera using `expo-camera`
- Allow capture or pick from gallery
- Resize photo (large photos slow uploads)
- Upload to backend POST `/api/photos/upload`
- Show auto-generated tags
- User can edit tags

**Deliverable:** Can take photo, upload, see auto-generated tags

---

### Day 21: Oct 13 (Sunday) - Tag Editing & Item Details Screen
**Time:** 4 hours
**What You'll Do:**
- Create item details screen (open item from list)
- Show:
  - Photo + tags
  - Item info
  - Current location
  - Who last moved it + when
- Allow edit/add/remove tags
- Call PUT `/api/items/:id` for updates

**Deliverable:** Can view and edit item details

---

### Day 22: Oct 14 (Monday) - Location Management Screen
**Time:** 4 hours
**What You'll Do:**
- Create locations management screen
- Show location tree
- Add new location (with parent selection)
- Delete location
- Call API endpoints

**Deliverable:** Can manage locations on mobile

---

### Day 23: Oct 15 (Tuesday) - Item Move Logging
**Time:** 4 hours
**What You'll Do:**
- Add "Move Item" button to item details
- Modal to select new location
- Call POST `/api/items/:id/locations`
- Show success message
- Update UI

**Deliverable:** Can log item moves from mobile

---

### Day 24: Oct 16 (Wednesday) - Search Screen
**Time:** 4 hours
**What You'll Do:**
- Create search screen with:
  - Text search field
  - Filter buttons (category, location, private toggle)
- Call POST `/api/search` with filters
- Display results
- Tap result to view item

**Deliverable:** Can search items

---

### Day 25: Oct 17 (Thursday) - Settings & Logout
**Time:** 4 hours
**What You'll Do:**
- Create settings screen:
  - Show logged-in user email
  - Logout button
  - About / version info
- Logout clears token + navigates to login

**Deliverable:** Settings screen working, logout functional

---

### Day 26: Oct 18 (Friday) - Mobile Polish & Error Handling
**Time:** 4 hours
**What You'll Do:**
- Fix any bugs from testing
- Add loading indicators (spinner while fetching)
- Add error messages (network issues, etc.)
- Test offline handling (graceful degradation)
- Test on both your phone and wife's phone (if available)

**Deliverable:** Mobile app polished, no obvious bugs

---

## SPRINT 4: Integration, Testing & Launch
### Oct 19 - Mid-November (roughly 20 hours spread across slower 2-hour/day pace)

**Goal:** Both phones syncing, comprehensive manual testing, soft launch.

### Days 27-30: Oct 19-22 (4 days) - End-to-End Testing Both Phones
**Time:** 2 hours/day (you're back at work Oct 19)
**What You'll Do:**
- Set up wife's phone with app
- Both log in separately (different user accounts)
- One person creates item, other person refreshes - does it appear?
- One person moves item, other person checks history
- Test all features on both phones simultaneously
- Document any bugs

**Deliverable:** Both phones syncing properly, no obvious issues

---

### Days 31-35: Oct 23-27 (5 days) - Bug Fixes & Refinement
**Time:** 2 hours/day
**What You'll Do:**
- Fix bugs found in testing
- Improve performance (optimize photo loading, pagination on item list)
- Fine-tune UI (spacing, colors, button sizes)
- Test edge cases (network drops, offline, large photos)

**Deliverable:** App is stable and fast

---

### Days 36-40: Oct 30 - Nov 3 (5 days) - Cataloguing Sprint
**Time:** 2 hours/day (some days more if you want)
**What You'll Do:**
- Set aside an afternoon (weekend) with wife to catalogue Loft - Paint Area
- Use app to log items
- Test real-world usage
- Gather feedback
- Note what works, what doesn't

**Deliverable:** 50-100 items catalogued, real feedback

---

### Days 41-45: Nov 6-10 (5 days) - Final Polish & Documentation
**Time:** 2 hours/day
**What You'll Do:**
- Fix any issues from cataloguing sprint
- Write basic user guide (email to wife: "Here's how to log an item")
- Set up GitHub README with setup instructions
- Test deployment one more time
- Plan v2 features based on feedback

**Deliverable:** Ready to announce soft launch

---

### Day 46+: Nov 13+ - Soft Launch & Ongoing
**Time:** 2 hours/day (ongoing)
**What You'll Do:**
- Soft launch: tell wife app is ready, full-time usage
- Gather feedback
- Plan v2 (search improvements, reports, movement analytics)
- Fix bugs as they surface

---

## What Not to Do (Scope Out of MVP)

**In v1, skip:**
- Full test suite (do manual + critical unit tests only)
- Public release documentation
- Web version (mobile only)
- Advanced reporting (counts, frequency)
- Multi-household management
- Push notifications
- Offline-first sync (basic offline ok)

**These are v2+ features.**

---

## Daily Workflow (What Your Day Looks Like)

1. **Start of day:** Open task for the day, read it thoroughly
2. **Ask me:** If anything's unclear, ask before coding
3. **Code:** I'll give you generated boilerplate; you adapt it
4. **Test:** Manual testing locally (Postman for API, Expo for mobile)
5. **Push to GitHub:** Commit with clear message, push
6. **End of day:** Note what you finished, what's blocked, what's next

---

## Key Principles

- **Generated code, not tutorials:** I give you working code; you understand it enough to adapt it
- **Conceptual guides:** When you need to understand something (JWT, RDS, S3), I explain the concept, not every line
- **Real testing:** Manual on phones, not just unit tests
- **Sustainable pace:** 4 hours/day before job, 2 hours/day after. Not hero hours.
- **Feedback loop:** Ask me anything. Stuck? Ask. Confused? Ask.

---

## Ready to Start?

You ready to start Day 1 (Sept 20) with AWS account setup? I'll be here every day to give you the detailed task and code templates.

Want to adjust anything in this plan first?
