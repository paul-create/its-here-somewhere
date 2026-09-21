# It's Here Somewhere

<div align="center">
  <img src="./assets/its_here_somewhere_logo-transparent.png" alt="It's Here Somewhere Logo" style="width: 50%; height: auto;" />
</div>

## Stop searching. Start knowing.

---

## The Problem

You're looking for something. You *know* you put it somewhere. You ask your partner where it is. They tidy it away and... forget to tell you. Cue 20 minutes of opening cupboards, checking drawers, and muttering under your breath.

Sound familiar?

**It's Here Somewhere** solves this the only way that works: **shared knowledge**. When you both log what goes where, nobody's guessing. Nobody's searching.

---

## What It Does

- **Log items and locations** - Add what you own and where it lives
- **Take photos** - Snap a picture so you remember what it actually looks like
- **Auto-tagged photos** - AI reads your photos and tags them automatically (no manual labelling)
- **Shared search** - Both of you search from the same source of truth
- **Item history** - See when things moved and who moved them
- **Private items** - Keep personal things to yourself if you need to

---

## Current State (MVP - In Development)

We're building the foundation right now. What you get:

✅ User accounts (secure login via AWS Cognito)  
✅ Photo upload to cloud storage  
✅ AI photo tagging with Claude  
✅ Item logging and categorisation  
✅ Basic search (coming soon)  

---

## Where We're Heading (Full Release)

By November 2026, expect:

- ✨ Location hierarchies (e.g., "Kitchen > Under Sink")
- ✨ Shared household profiles
- ✨ Real-time sync across devices
- ✨ Item condition tracking ("needs mending", "buy more")
- ✨ Household dashboard & statistics
- ✨ Mobile app for iOS and Android
- ✨ Web app for quick lookups

---

## Tech Stack

**Frontend:** React Native + Expo (one codebase, iOS + Android + Web)  
**Backend:** Node.js + Express  
**Database:** PostgreSQL  
**Storage:** AWS S3  
**AI:** Claude API (Anthropic) for photo tagging  
**Auth:** AWS Cognito  
**Cloud:** AWS (RDS, S3, App Runner)  
**IaC:** Terraform  

---

## Getting Started

### For Users

The app isn't public yet - we're still building. Sign up for updates at [link TBC].

### For Developers

Want to contribute or run it locally?

#### Prerequisites
- Node.js (v18+)
- PostgreSQL
- AWS account (for S3, RDS, Cognito)
- Git

#### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/paul-create/its-here-somewhere.git
   cd its-here-somewhere
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up AWS infrastructure**
   ```bash
   cd terraform
   terraform apply -var="db_password=YourSecurePassword"
   cd ..
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your AWS endpoints and credentials
   ```

5. **Run migrations**
   ```bash
   node run-migration.js
   ```
   
## Development Troubleshooting
1. Backend running: `npm start` (from root directory)
2. Two PowerShell windows open:
   - **Window 1 (Backend):** `cd ..\its-here-somewhere && npm start`
   - **Window 2 (Mobile):** `cd ..\its-here-somewhere\mobile && npm start`

### Network Connection Issues

**Problem:** Login fails with "Failed to connect to /192.168.1.x:3000"

**Solutions:**

1. **Disable NordVPN on both devices**
   - NordVPN blocks local network access (10.x.x.x and 192.x.x.x ranges)
   - Disable on both laptop and Android phone while testing
   - You can use split tunneling in NordVPN settings to whitelist local network, but easiest is just to turn it off during dev

2. **Update IP address in AuthContext.tsx**
   - IP addresses change depending on your network
   - Run `ipconfig` on your laptop to find your current IPv4 (usually 192.168.x.x)
   - Update `src/context/AuthContext.tsx` line with fetch URL:
```typescriptreact
     const response = await fetch('http://YOUR_IP:3000/api/auth/login', {
```
   - **Don't forget the :3000 port number**

3. **Verify both devices are on same WiFi**
   - Laptop: Run `ipconfig` and check IPv4 and WiFi network name
   - Phone: Settings > WiFi and verify same network
   - Both should have similar IP ranges (e.g., 192.168.1.x)

4. **Check backend is running**
   - PowerShell window 1 should show: "Server running on port 3000"
   - If not, run `npm start` in the root directory

---

## Architecture Overview
<div align="center">
  <img src="./assets/architecture.png" alt="High Level Architecture" style="width: 100%; height: auto;" />
</div>

## Contributing

Not open for public contributions yet, but we'll welcome them soon. Check back after the November release.

---

## Roadmap

| Phase | Status | Est. Completion |
|-------|--------|-----------------|
| **MVP** - Core auth, photo upload, tagging | 🔨 In Progress | Late September 2026 |
| **Backend Complete** - Full item/location/search APIs | 📋 Planned | Early October 2026 |
| **Mobile App** - React Native iOS + Android | 📋 Planned | Mid-October 2026 |
| **Integration & Launch** - Testing, polish, soft launch | 📋 Planned | November 2026 |

---

## Known Limitations (MVP)

- Search is basic (exact match for now - fuzzy search coming)
- No offline mode yet
- Real-time sync uses polling, not WebSockets (efficient but slower)
- Mobile app UI still being designed
- No bulk import from photos yet

---

## License

MIT License - See LICENSE file for details.

---

## Questions?

Reach out to [paul@example.com] or open an issue on GitHub.

---

**Built by Paul Francis** | London, UK | 2026
