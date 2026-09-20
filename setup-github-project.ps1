# It's Here Somewhere - GitHub Project Setup Script
# This script automatically creates the GitHub Project board and all 46 daily issues
# Prerequisites: GitHub CLI installed and authenticated (run: gh auth login)

$Owner = "paul-create"
$Repo = "its-here-somewhere"

Write-Host "Setting up GitHub Project for It's Here Somewhere..." -ForegroundColor Green

# Step 1: Create Milestones
Write-Host "`nCreating Sprint milestones..." -ForegroundColor Cyan

$milestones = @(
    @{ title = "Sprint 1: AWS Foundation"; description = "Sept 20-27: AWS, PostgreSQL, Node.js scaffolding" },
    @{ title = "Sprint 2: Backend Complete"; description = "Oct 1-7: Full backend with auth, items, photos, tagging" },
    @{ title = "Sprint 3: React Native Mobile"; description = "Oct 8-18: Complete mobile app" },
    @{ title = "Sprint 4: Integration & Launch"; description = "Oct 19 - Mid-Nov: Integration, testing, soft launch" }
)

foreach ($milestone in $milestones) {
    gh api repos/$Owner/$Repo/milestones -f title=$($milestone.title) -f description=$($milestone.description) 2>$null
    Write-Host "  Created: $($milestone.title)"
}

# Step 2: Create Labels
Write-Host "`nCreating labels..." -ForegroundColor Cyan

$labels = @(
    @{ name = "Sprint-1"; color = "1f6feb" },
    @{ name = "Sprint-2"; color = "a371f7" },
    @{ name = "Sprint-3"; color = "8957e5" },
    @{ name = "Sprint-4"; color = "d29922" },
    @{ name = "AWS-Setup"; color = "0366d6" },
    @{ name = "Backend"; color = "0366d6" },
    @{ name = "Mobile"; color = "6f42c1" },
    @{ name = "Integration"; color = "f34235" },
    @{ name = "4-hours"; color = "bfdadc" },
    @{ name = "2-hours"; color = "e8c5d1" }
)

foreach ($label in $labels) {
    gh label create -c $($label.color) $($label.name) 2>$null
    Write-Host "  Created: $($label.name)"
}

# Step 3: Create all Sprint issues
Write-Host "`nCreating all Sprint issues..." -ForegroundColor Cyan

# Sprint 1 Issues (Days 1-8)
@(
    @{ day = 1; date = "Sept 20"; title = "AWS Account Setup & IAM"; sprint = "Sprint 1: AWS Foundation"; labels = "Sprint-1,Backend,4-hours" },
    @{ day = 2; date = "Sept 21"; title = "PostgreSQL RDS Setup"; sprint = "Sprint 1: AWS Foundation"; labels = "Sprint-1,Backend,4-hours" },
    @{ day = 3; date = "Sept 22"; title = "S3 Bucket & Cognito Setup"; sprint = "Sprint 1: AWS Foundation"; labels = "Sprint-1,Backend,4-hours" },
    @{ day = 4; date = "Sept 23"; title = "Node.js Project Scaffolding & Database Schema"; sprint = "Sprint 1: AWS Foundation"; labels = "Sprint-1,Backend,4-hours" },
    @{ day = 5; date = "Sept 24"; title = "Express Server & Cognito Auth Middleware"; sprint = "Sprint 1: AWS Foundation"; labels = "Sprint-1,Backend,4-hours" },
    @{ day = 6; date = "Sept 25"; title = "Auth Routes & User Sync"; sprint = "Sprint 1: AWS Foundation"; labels = "Sprint-1,Backend,4-hours" },
    @{ day = 7; date = "Sept 26"; title = "S3 Photo Upload & Claude API Integration Setup"; sprint = "Sprint 1: AWS Foundation"; labels = "Sprint-1,Backend,4-hours" },
    @{ day = 8; date = "Sept 27"; title = "GitHub Setup & CI-CD Pipeline"; sprint = "Sprint 1: AWS Foundation"; labels = "Sprint-1,Backend,4-hours" },
    
    # Sprint 2 Issues (Days 9-15)
    @{ day = 9; date = "Oct 1"; title = "Item CRUD Endpoints"; sprint = "Sprint 2: Backend Complete"; labels = "Sprint-2,Backend,4-hours" },
    @{ day = 10; date = "Oct 2"; title = "Category Management"; sprint = "Sprint 2: Backend Complete"; labels = "Sprint-2,Backend,4-hours" },
    @{ day = 11; date = "Oct 3"; title = "Photo Auto-Tagging (Claude API)"; sprint = "Sprint 2: Backend Complete"; labels = "Sprint-2,Backend,4-hours" },
    @{ day = 12; date = "Oct 4"; title = "Location Hierarchy"; sprint = "Sprint 2: Backend Complete"; labels = "Sprint-2,Backend,4-hours" },
    @{ day = 13; date = "Oct 5"; title = "Item Location Tracking"; sprint = "Sprint 2: Backend Complete"; labels = "Sprint-2,Backend,4-hours" },
    @{ day = 14; date = "Oct 6"; title = "Search Skeleton & Error Handling"; sprint = "Sprint 2: Backend Complete"; labels = "Sprint-2,Backend,4-hours" },
    @{ day = 15; date = "Oct 7"; title = "Backend Polish & Deployment"; sprint = "Sprint 2: Backend Complete"; labels = "Sprint-2,Backend,4-hours" },
    
    # Sprint 3 Issues (Days 16-26)
    @{ day = 16; date = "Oct 8"; title = "React Native Scaffolding & Navigation"; sprint = "Sprint 3: React Native Mobile"; labels = "Sprint-3,Mobile,4-hours" },
    @{ day = 17; date = "Oct 9"; title = "Login Screen"; sprint = "Sprint 3: React Native Mobile"; labels = "Sprint-3,Mobile,4-hours" },
    @{ day = 18; date = "Oct 10"; title = "Home Screen & Item List"; sprint = "Sprint 3: React Native Mobile"; labels = "Sprint-3,Mobile,4-hours" },
    @{ day = 19; date = "Oct 11"; title = "Add Item Form"; sprint = "Sprint 3: React Native Mobile"; labels = "Sprint-3,Mobile,4-hours" },
    @{ day = 20; date = "Oct 12"; title = "Photo Capture & Upload"; sprint = "Sprint 3: React Native Mobile"; labels = "Sprint-3,Mobile,4-hours" },
    @{ day = 21; date = "Oct 13"; title = "Tag Editing & Item Details Screen"; sprint = "Sprint 3: React Native Mobile"; labels = "Sprint-3,Mobile,4-hours" },
    @{ day = 22; date = "Oct 14"; title = "Location Management Screen"; sprint = "Sprint 3: React Native Mobile"; labels = "Sprint-3,Mobile,4-hours" },
    @{ day = 23; date = "Oct 15"; title = "Item Move Logging"; sprint = "Sprint 3: React Native Mobile"; labels = "Sprint-3,Mobile,4-hours" },
    @{ day = 24; date = "Oct 16"; title = "Search Screen"; sprint = "Sprint 3: React Native Mobile"; labels = "Sprint-3,Mobile,4-hours" },
    @{ day = 25; date = "Oct 17"; title = "Settings & Logout"; sprint = "Sprint 3: React Native Mobile"; labels = "Sprint-3,Mobile,4-hours" },
    @{ day = 26; date = "Oct 18"; title = "Mobile Polish & Error Handling"; sprint = "Sprint 3: React Native Mobile"; labels = "Sprint-3,Mobile,4-hours" },
    
    # Sprint 4 Issues (Days 27+)
    @{ day = "27-30"; date = "Oct 19-22"; title = "End-to-End Testing Both Phones"; sprint = "Sprint 4: Integration & Launch"; labels = "Sprint-4,Integration,2-hours" },
    @{ day = "31-35"; date = "Oct 23-27"; title = "Bug Fixes & Refinement"; sprint = "Sprint 4: Integration & Launch"; labels = "Sprint-4,Integration,2-hours" },
    @{ day = "36-40"; date = "Oct 30-Nov 3"; title = "Cataloguing Sprint with Wife"; sprint = "Sprint 4: Integration & Launch"; labels = "Sprint-4,Integration,2-hours" },
    @{ day = "41-45"; date = "Nov 6-10"; title = "Final Polish & Documentation"; sprint = "Sprint 4: Integration & Launch"; labels = "Sprint-4,Integration,2-hours" },
    @{ day = "46+"; date = "Nov 13+"; title = "Soft Launch & Ongoing Feedback"; sprint = "Sprint 4: Integration & Launch"; labels = "Sprint-4,Integration,2-hours" }
) | ForEach-Object {
    $issueTitle = "[Day $($_.day) - $($_.date)] $($_.title)"
    $issueBody = "Day $($_.day): $($_.title)`n`nDate: $($_.date)`n`nSee sprint plan for full details.`n`nAcceptance Criteria:`n- Task completed`n- Code tested`n- Pushed to GitHub"
    
    gh issue create --title $issueTitle --body $issueBody --label $($_.labels) --milestone $($_.sprint) 2>$null
    Write-Host "  Created: Day $($_.day) - $($_.title)"
}

Write-Host "`n"
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://github.com/$Owner/$Repo"
Write-Host "2. Create a new Project board (Projects tab)"
Write-Host "3. All 46 issues are ready!"
Write-Host "`nStart building on Sept 20 with Day 1."