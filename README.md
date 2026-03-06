# Multi-Warehouse Inventory Management System

## Overview
Enhance the existing Multi-Warehouse Inventory Management System built with Next.js and Material-UI (MUI) for GreenSupply Co, a sustainable product distribution company. The current system is functional but needs significant improvements to be production-ready.

## 🎯 Business Context
GreenSupply Co distributes eco-friendly products across multiple warehouse locations throughout North America. They need to efficiently track inventory across warehouses, manage stock movements, monitor inventory values, and prevent stockouts. This system is critical for their daily operations and customer satisfaction.

## 🛠️ Tech Stack
- [Next.js](https://nextjs.org/) - React framework
- [Material-UI (MUI)](https://mui.com/) - UI component library
- [React](https://reactjs.org/) - JavaScript library
- JSON file storage (for this assessment)

## 📋 Current Features (Already Implemented)
The basic system includes:
- ✅ Products management (CRUD operations)
- ✅ Warehouse management (CRUD operations)
- ✅ Stock level tracking per warehouse
- ✅ Basic dashboard with inventory overview
- ✅ Navigation between pages
- ✅ Data persistence using JSON files

**⚠️ Note:** The current UI is intentionally basic. We want to see YOUR design skills and creativity.

---

## 🚀 Your Tasks (Complete ALL 4)

---

## Task 1: Redesign & Enhance the Dashboard

**Objective:** Transform the basic dashboard into a professional, insightful command center for warehouse operations.

### Requirements:

Redesign the dashboard to provide warehouse managers with actionable insights at a glance. Your implementation should include:

- **Modern, professional UI** appropriate for a sustainable/eco-friendly company
- **Key business metrics** (inventory value, stock levels, warehouse counts, etc.)
- **Data visualizations** using a charting library of your choice
- **Enhanced inventory overview** with improved usability
- **Fully responsive design** that works across all device sizes
- **Proper loading states** and error handling

Focus on creating an interface that balances visual appeal with practical functionality for daily warehouse operations.

---

## Task 2: Implement Stock Transfer System

**Objective:** Build a complete stock transfer workflow with proper business logic, validation, and data integrity.

### Requirements:

**A. Stock Transfer System**

Build a complete stock transfer system that allows moving inventory between warehouses. Your implementation should include:

- Data persistence for transfer records (create `data/transfers.json`)
- API endpoints for creating and retrieving transfers
- Proper validation and error handling
- Stock level updates across warehouses
- Transfer history tracking

Design the data structure, API contracts, and business logic as you see fit for a production system.

**B. Data Integrity**

Transfers must be **atomic** — if the server crashes or an error occurs mid-transfer, neither warehouse should end up with incorrect stock levels. Consider what happens if the process fails after deducting from the source warehouse but before crediting the destination.

Document your approach to ensuring data integrity in code comments or your video walkthrough.

**C. Transfer Page UI**

Create a `/transfers` page that provides:
- A form to initiate stock transfers between warehouses
- Transfer history view
- Appropriate error handling and user feedback

Design the interface to be intuitive for warehouse managers performing daily operations.

---

## Task 3: Build Low Stock Alert & Reorder System

**Objective:** Create a practical system that helps warehouse managers identify and act on low stock situations.

### Requirements:

Build a low stock alert and reorder recommendation system that helps warehouse managers proactively manage inventory levels.

**A. Alert System**
- Identify products that need reordering based on current stock levels and reorder points
- Categorize inventory by stock status (critical, low, adequate, overstocked)
- Provide actionable reorder recommendations with calculated quantities (see below)
- Allow managers to track and update alert status
- Integrate alerts into the main dashboard

**B. Reorder Quantity Calculation**

Don't just flag low stock — calculate a **recommended reorder quantity** for each product. Your formula should factor in:

- Current total stock across all warehouses
- The product's reorder point
- **Transfer velocity** — how quickly stock is moving between warehouses (derived from the transfer history you built in Task 2)
- A **configurable lead time** (in days) representing how long a reorder takes to arrive

Design and document your formula. Explain your assumptions and how you handle edge cases (e.g., new products with no transfer history, zero velocity).

**C. Implementation Details**
- Create an `/alerts` page for viewing and managing alerts
- Calculate stock across all warehouses
- Persist alert tracking data (create `data/alerts.json`)
- Design appropriate status workflows and user actions

Use your judgment to determine appropriate thresholds, calculations, and user workflows for a production inventory management system.

---

## Task 4: Bug Investigation & System Design

**Objective:** Demonstrate debugging ability and architectural thinking.

### A. Bug Hunt

We've received reports from warehouse managers that **inventory values on the dashboard become incorrect after certain product management operations**. The values are fine initially but drift after normal use of the system.

- Investigate the existing codebase to find the root cause
- Document your debugging process (what you checked, how you traced it)
- Fix the bug
- Explain the fix in your video walkthrough

### B. Scaling Write-up

The current system uses JSON file storage and is designed for a small operation. Suppose GreenSupply Co grows to **500 warehouses, 10,000 products, and 50 concurrent users**.

In your README, write 1-2 paragraphs addressing:
- What breaks first in the current architecture?
- How would you evolve this system to handle that scale?
- What specific technologies or patterns would you introduce, and why?

This is not a trick question — we want to understand how you think about systems, not just how you write code.

### Task 4B – Scaling Discussion

At the current scale, JSON file storage and in-process file reads/writes are acceptable, but they would be the first thing to break with 500 warehouses, 10,000 products, and 50 concurrent users. Every API call re-reads and rewrites whole JSON files under a single Node.js process, so latency and I/O contention would grow quickly, concurrent writes could overwrite each other, and there is no real transactionality or indexing. As data grows, computing aggregates like total inventory value or alert calculations by scanning entire files on each request would also become too slow and memory-heavy.

To evolve this system, I would move persistence into a real database (e.g. PostgreSQL for strong consistency and relational modelling), add proper indexing on hot paths (product, warehouse, stock, transfer, and alert tables), and push aggregate queries into the database instead of recomputing them in application code. For scale and reliability, I’d put the Next.js app behind a load balancer, use a connection-pooled database, and introduce a background worker (e.g. with a job queue like BullMQ + Redis) for heavier calculations such as periodic inventory valuation and alert generation. For read-heavy dashboard traffic, I’d add caching (e.g. Redis or a managed cache) for frequently requested aggregates and possibly adopt CQRS-style read models, so writes remain transactional while the dashboard reads from precomputed, denormalized views.

---

## 📦 Getting Started

### Prerequisites
- Node.js (v16 or higher recommended)
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Screen recording software for video submission (Loom, OBS, QuickTime, etc.)

### Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser to http://localhost:3000
```

### Project Structure
```
inventory-management-task/
├── data/                  # JSON data files
├── src/
│   └── pages/            # Next.js pages and API routes
└── package.json
```

The existing codebase includes product, warehouse, and stock management features. Explore the code to understand the current implementation before starting your tasks.

---

## 📝 Submission Requirements

### 1. Code Submission
- Push your code to **your own GitHub repository** (fork or new repo)
- Clear commit history showing your progression
- Update `package.json` with any new dependencies
- Application must run with: `npm install && npm run dev`

### 2. Video Walkthrough (5-10 minutes) - REQUIRED ⚠️

Record a video demonstration covering:

**Feature Demo (4-5 minutes)**
- Redesigned dashboard walkthrough (demonstrate responsiveness)
- Stock transfer workflow (show both successful and error scenarios)
- Alert system functionality and reorder calculations
- Bug investigation: explain how you found and fixed it

**Code Explanation (3-4 minutes)**
- Key technical decisions and approach
- How you ensured transfer atomicity
- Your reorder quantity formula and the reasoning behind it
- Code structure highlights

**Reflection (1-2 minutes)**
- What you're proud of
- Known limitations or trade-offs
- What you'd improve with more time

**Format:** Upload to YouTube (unlisted), Loom, or similar platform. Include link in your README.

### 3. Update This README

Add an implementation summary at the bottom with:
- Your name and completion time
- Features completed
- Key technical decisions
- Known limitations
- Testing instructions
- Video walkthrough link
- Any new dependencies added

---

## ⏰ Timeline

**Deadline:** 3 days (72 hours) from receiving this assignment

Submit:
1. GitHub repository link
2. Video walkthrough link
3. Updated README with implementation notes

**Estimated effort:** 15-18 hours total

**Note:** This timeline reflects real-world project constraints. Manage your time effectively and prioritize core functionality over bonus features.

---

## 🏆 Optional Enhancements

If you have extra time, consider adding:
- Live deployment (Vercel/Netlify)
- Dark mode
- Export functionality (CSV/PDF)
- Keyboard shortcuts
- Advanced filtering
- Accessibility features
- Unit tests
- TypeScript
- Additional features you think add value

**Important:** Complete all 4 core tasks before attempting bonuses. Quality of required features matters more than quantity of extras.

---

## 🤔 Frequently Asked Questions

**Q: Can I use additional libraries?**
A: Yes! Add them to package.json and document your reasoning.

**Q: What if I encounter technical blockers?**
A: Document the issue, explain what you tried, and move forward with the next task. Include this in your video explanation.

**Q: Can I modify the existing data structure?**
A: You can add fields, but don't break the existing structure that other features depend on.

**Q: What if I can't complete everything?**
A: Submit what you have with clear documentation. Quality over quantity.

**Q: How will my submission be used?**
A: This is solely for technical assessment. Your code will not be used commercially.

---

## 🧠 What We're Looking For

This assessment goes beyond "can you build features." We're evaluating:

- **Reasoning over output** — We care more about *why* you made a decision than how much code you wrote. A well-reasoned formula with clear documentation beats a complex implementation you can't explain.
- **Debugging ability** — Can you trace through unfamiliar code, form a hypothesis, and verify it?
- **Data integrity thinking** — Do you consider what happens when things go wrong, not just when they go right?
- **Architectural awareness** — Do you understand the system you're building on, including its limitations?
- **Clean, maintainable code** — Professional structure, proper error handling, good naming.
- **Communication** — Your video and written documentation should be clear and well-organized.

You are welcome to use any tools you like, including AI assistants. We are evaluating the quality of your *decisions and understanding*, not whether you typed every character yourself.

---

## 🚀 Final Notes

Do your best work, document your decisions, and show us how you think — not just what you can build.

Good luck! 💪

---

**Setup issues?** Verify Node.js is installed and you're using a modern browser. If problems persist, document them in your submission.



-----------------------------------------------------------------------------------------------------------------

✅ Implementation Summary – Task 1 (Dashboard Redesign)

Name: Joven P. Labiste
Task Completed: Task 1 – Redesign & Enhance the Dashboard

Summary of what’s in place for Task 1: Redesign & Enhance the Dashboard:
1. Eco-friendly theme and styling
- src/theme.js – MUI theme with forest green (#2d6a4f), sage (#52796f), light greens, and neutrals; DM Sans typography; soft shadows and borders.
- src/styles/globals.css – DM Sans font import, background #f8faf8, text color #1b4332.
- src/pages/_app.js – Wrapped in ThemeProvider and CssBaseline so the theme applies app-wide.

2. Key business metrics (top cards)
- Inventory value – Total value of stock (unit cost × quantity). 
- Total units – Sum of all stock quantities. 
- Products – Number of products. 
- Warehouses – Number of warehouses. 
- Low stock items – Count of products below reorder point (card highlighted when > 0).

3. Data visualizations (Recharts)
- Inventory value by category – Pie chart with category breakdown and tooltips in dollars. 
- Stock by warehouse – Bar chart of total units per warehouse.

4. Inventory overview
- Search – Filter by SKU, product name, or category. 
- Status filters – Chips: “All”, “Low stock”, “In stock”. 
- Desktop/tablet – Table with green header, row highlighting for low stock, status chips. 
- Mobile – Card list with left border (green = in stock, amber = low stock), same info as table.

5. Loading and error handling
- Loading – Skeleton placeholders for metrics, charts, and table while data is fetched. 
- Error – Alert and short message if any of the three API calls fail; nav still visible.

6. Responsive behavior
- Metrics – Grid: 1 column on xs, 2 on sm, 3 on md, 5 on lg. 
- Charts – Side-by-side on md+, stacked on small screens; ResponsiveContainer for chart width. 
- Nav – Toolbar wraps on small screens. 
- Table – Replaced by inventory cards on sm and below.

The dashboard now uses the sustainable theme, shows the main metrics and charts, improves the inventory overview with search and filters, and stays usable on all screen sizes with clear loading and error states. Run npm run dev and open the app to try it; the build failure was an environment/sandbox EPERM (spawn) issue, not from these code changes.



✅ Implementation Summary – Task 2 (Stock Transfer System)

Name: Joven P. Labiste
Task Completed: Task 2 – Implement the Stock Transfer System

**A. Stock transfer system**

1. Data persistence
- data/transfers.json – Initialized as []. Each transfer is stored with: id, fromWarehouseId, toWarehouseId, productId, quantity, status, createdAt, completedAt.

2. API (src/pages/api/transfers/index.js)
- GET – Returns all transfers, newest first.
- POST – Creates a transfer: validates input, checks stock, updates stock in memory, then persists.

3. Validation and errors
- Source ≠ destination warehouse.
- Product and both warehouses must exist.
- Quantity must be a positive integer.
- Sufficient stock at source; 400 with available and requested when not.

4. Stock updates
- Source row: quantity - amount.
- Destination: existing row quantity + amount, or new stock row if none exists.
- All changes applied in one in-memory update, then written once to stock.json.

5. History
- Every completed transfer is appended to transfers.json with status: 'completed', createdAt, and completedAt.


**B. Data integrity (atomicity)**
- No two-step deduct-then-credit: Deduct and add are computed together in memory; a single write to stock.json applies both. A crash never leaves “deducted but not credited”.
- Write order: stock.json is written first, then transfers.json. So:
1. Crash before both: no change.
2. Crash after stock.json only: stock is correct; transfer may be missing from history (audit gap only).
3. Crash after both: full consistency.
- This is documented in comments at the top of src/pages/api/transfers/index.js.

**C. Transfer page UI (/transfers)**
1. AppBar – Same as other pages, with Transfers in the nav.

2. New transfer form
- From warehouse, To warehouse, Product (dropdowns).
- Quantity with “max <available>” when product and source are selected.
- Submit runs POST with loading state and clears form on success.

3. Transfer history
- Table: Date, Product, From, To, Qty, Status (newest first).
- Empty state when there are no transfers.

4. Feedback
- Success alert after a successful transfer (dismissible).
- Error alert with API message (e.g. “Insufficient stock at source warehouse”) (dismissible).
- Loading spinner while fetching data and while submitting.

5. Navigation
- “Transfers” link added in the AppBar on: Dashboard (index.js), Stock Levels, Add Stock, and the Transfers page.


✅ Implementation Summary – Task 3

Name: Joven P. Labiste
Task Completed: Task 3 – Build Low Stock Alert & Reorder System

### What’s implemented for Task 3

*   **Alerts backend (/api/alerts)**
    
    *   New file data/alerts.json stores per-product alert workflow state: productId, workflowStatus (open | in\_progress | resolved), optional notes, and updatedAt.
        
    *   New route src/pages/api/alerts/index.js:
        
        *   **GET /api/alerts?leadTimeDays=N**
            
            *   Reads products.json, stock.json, transfers.json, alerts.json.
                
            *   Calculates, per product:
                
                *   **Total stock across all warehouses** (sum of all stock rows for that productId).
                    
                *   **Stock status category** using reorderPoint = R:
                    
                    *   critical: totalStock === 0 or totalStock < 0.5 \* R
                        
                    *   low: 0.5 \* R ≤ totalStock < R
                        
                    *   adequate: R ≤ totalStock ≤ 2 \* R
                        
                    *   overstocked: totalStock > 2 \* R
                        
                *   **Transfer velocity per day v**:
                    
                    *   Only transfers with status === 'completed' in last 30 days.
                        
                    *   v = (sum of quantities in window) / 30.
                        
                *   **Lead time L** from query (leadTimeDays), default **7** days if missing/invalid.
                    
                *   **Reorder formula**:
                    
                    *   If v > 0:
                        
                        *   projectedDemand = v × L
                            
                        *   targetStock = R + projectedDemand (cover lead-time demand plus keep reorder-point safety stock).
                            
                    *   If v === 0 (no or negligible history):
                        
                        *   targetStock = R (fall back to reorder point only).
                            
                    *   recommendedReorderQty = max( ceil(targetStock − totalStock), 0 ).
                        
                *   **Edge cases handled**:
                    
                    *   New products / zero history → v = 0, so if totalStock < R we suggest R − totalStock, else 0.
                        
                    *   Tiny velocities treated effectively as zero to avoid over-ordering slow movers.
                        
                    *   If R ≤ 0 (not expected in this data), we classify positive stock as adequate and very large stock as overstocked for safety.
                        
                *   **Days of cover**: daysOfCover = totalStock / v when v > 0, else null.
                    
                *   **Workflow status**:
                    
                    *   Defaults to 'open' for critical/low, 'resolved' for adequate/overstocked if no saved record.
                        
                    *   Uses saved workflowStatus from alerts.json when present.
                        
                *   Returns per-product objects with: productId, sku, name, category, reorderPoint, totalStock, status, transferVelocityPerDay, leadTimeDays, recommendedReorderQty, needsReorder, workflowStatus, notes, daysOfCover.
                    
        *   **POST /api/alerts**
            
            *   Validates productId (positive int) and workflowStatus (open | in\_progress | resolved).
                
            *   Upserts into alerts.json with trimmed notes (optional) and updatedAt.
                
            *   Used by the UI to track/transition alert workflow state.
                
*   **Alerts UI (/alerts)**
    
    *   New page src/pages/alerts/index.js (“Alerts & Reorders”):
        
        *   **Top metrics cards**:
            
            *   **Critical alerts**: count of critical alerts that are needsReorder and workflow open/in\_progress.
                
            *   **Low alerts**: same for low.
                
            *   **Overstocked**: count of all products with status === 'overstocked'.
                
            *   **Lead time (days)**: numeric input + “Apply” button; re-fetches /api/alerts?leadTimeDays=N, so managers can simulate different vendor lead times.
                
        *   **Filters**:
            
            *   **Stock status**: All, Critical, Low, Adequate, Overstocked.
                
            *   **Workflow**:
                
                *   “Action needed” → needsReorder and workflowStatus in open or in\_progress.
                    
                *   “All statuses”.
                    
                *   “Resolved\`”.
                    
        *   **Table per product**:
            
            *   Product name & SKU, category.
                
            *   Total stock, reorder point.
                
            *   Stock status chip (Critical/Low/Adequate/Overstocked, color-coded).
                
            *   Velocity (units/day) and days of cover (e.g. 12.3d or —).
                
            *   Recommended reorder (blank when 0).
                
            *   Workflow:
                
                *   Chip reflecting current state (Open / In progress / Resolved).
                    
                *   TextField select allowing change of workflow status; each change posts to /api/alerts.
                    
            *   Rows for critical/low alerts are lightly highlighted (error.lighter / warning.light) to stand out.
                
        *   Handles loading (CircularProgress) and API errors (Alert), plus disables status dropdown per-row while an update is in-flight.
            
*   **Dashboard integration**
    
    *   src/pages/index.js:
        
        *   useDashboardData now fetches an additional endpoint:
            
            *   /api/alerts?leadTimeDays=7 alongside products/warehouses/stock.
                
            *   Stores alerts in local state and exposes them from the hook.
                
        *   New computed metric:
            
            *   openAlertsCount = alerts.filter(a => a.needsReorder && a.workflowStatus !== 'resolved').length.
                
        *   Reworked the fifth metric card into **“Low stock & alerts”**:
            
            *   Main number: existing lowStockCount (products below reorder point across all warehouses).
                
            *   Subtext: Open alerts: N from openAlertsCount.
                
            *   Styling: highlights when either low-stock items or open alerts exist.
                
            *   Adds a small **“View alerts”** button linking directly to /alerts, making the alert system part of the main command center.
                
    *   **Navigation**:
        
        *   Added an **Alerts** button to the AppBar in:
            
            *   src/pages/index.js (Dashboard)
                
            *   src/pages/stock/index.js (Stock Levels)
                
            *   src/pages/stock/add.js (Add Stock)
                
            *   src/pages/transfers/index.js (Transfers)
                
        *   The /alerts page itself includes an Alerts tab for consistency.
            

### How to use it

*   **Review alerts**:
    
    *   Open /alerts. By default you see actionable (open/in-progress) critical/low items with recommended reorder quantities based on total stock, reorder point, 30-day transfer velocity, and a 7-day lead time.
        
*   **Change lead time**:
    
    *   Adjust the lead time card’s value (e.g. 14 days) and click **Apply** to recompute all recommendations under a different vendor lead time assumption.
        
*   **Work alerts**:
    
    *   Use the workflow dropdown to move items from **Open → In progress → Resolved** as you place orders or resolve issues; the state persists in alerts.json.
        
*   **From the dashboard**:
    
    *   The “Low stock & alerts” card shows how many products are below reorder point and how many open alerts exist; click **View alerts** to drill into details.