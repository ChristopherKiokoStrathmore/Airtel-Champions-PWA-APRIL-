Create a modern, clean, professional web app UI for Airtel Kenya CRM (Next.js + Tailwind + shadcn style) with a toggle between two modes after login.

Overall style:
- Airtel brand colors: Primary blue #00AEEF, Success green #00C853, Neutral dark #1F2937
- Clean SaaS design, lots of white space, subtle shadows, rounded corners
- Responsive (desktop + mobile view)
- Top navbar with Airtel logo left, user avatar right

Post-login experience (main screens):

1. Login screen (simple)
   - Airtel logo
   - Phone number login field + "Login with Airtel Number" button
   - "Forgot PIN?" link

2. After successful login – show this layout:
   - Top navbar:
     - Left: Airtel CRM logo + current mode indicator
     - Center: Toggle switch with two pills:
       [ Sales Mode ]   <->   [ HBB Installer Mode ]
     - Right: Logged-in user name + phone + logout
   - Left sidebar (collapsible on mobile) with:
     - Dashboard
     - Service Requests (active in HBB mode)
     - Installers
     - Reports
     - Settings

3. Sales Mode (default for most users)
   - Keep exactly the same layout and screens the Sales team already has (placeholder area is fine)

4. HBB Installer Mode (the new side – make this the hero design)
   - When toggled ON, the entire main content area changes to:
     
     A. Dashboard Overview (first screen after toggle)
        - 4 KPI cards: Open Leads (large number), Today’s Installations, Pending Allocation, Active Installers
        - Quick town filter pills (NAIROBI, MOMBASA, KISUMU, ELDORET, etc.)
        - Recent Activity feed (last 5 SRs)

     B. Service Requests (main working screen – most important)
        - Top: Big green button “AUTO ALLOCATE ALL OPEN LEADS” with tooltip
        - Search bar + filters:
          - Town dropdown
          - Status multi-select (Open, Assigned, Rescheduled, Completed, Failed Activation, Client Not Ready, Unreachable)
          - Preferred Date range picker
        - Clean data table with these columns:
          SR Number | Customer Name | Phone | Preferred Date | Town | Estate | Package | Status (colored badge) | Assigned Installer | Booked Time | Actions (View + Assign)
        - Status badges with clear colors (Open=blue, Assigned=orange, Completed=green, Failed=red)
        - Pagination at bottom

     C. Service Request Detail (modal that opens when clicking a row)
        - Customer info card
        - Preferred date/time/location
        - Status dropdown
        - Assign Installer dropdown (filtered by town)
        - Remarks textarea
        - Buttons: Save Changes | Auto Allocate This Lead | Close

     D. Installers Screen (accessible from sidebar)
        - Table: Installer Name | Phone | Status (Available/Busy) | Max Jobs/Day | Covered Towns (tags)
        - Capacity overview cards

Additional requirements:
- Show a small “HBB Installer Mode” banner at the top when active
- All buttons and tables must look production-ready
- Include tooltips on AUTO ALLOCATE buttons
- Make everything fully editable in Figma with real sample data (use Kenyan names and towns)
- Generate both desktop and mobile versions
- Start with the HBB Installer Mode screens as the main focus

Generate the full flow starting from login → toggle → HBB Service Requests screen.