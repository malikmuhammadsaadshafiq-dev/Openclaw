import re
import sys

filepath = sys.argv[1] if len(sys.argv) > 1 else '/root/mvp-factory/daemon/mvp-factory-daemon.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

# ======== 1. UPGRADE FUNCTIONALITY_RULES ========
old_func_rules = """CRITICAL - MVP MUST BE FUNCTIONAL:

1. USER INTERACTIONS (Required):
   - Forms that actually submit and show results
   - Buttons that trigger visible actions
   - Input fields with real-time validation
   - Loading states when actions happen
   - Success/error feedback messages
   - Modal dialogs for confirmations

2. STATE MANAGEMENT (Required):
   - useState for all interactive elements
   - Track user inputs in state
   - Show/hide components based on state
   - Counter or progress tracking
   - Lists that can be added/removed

3. DEMO DATA (Required):
   - Pre-populated realistic sample data
   - At least 5-10 demo items to show
   - User can interact with demo data
   - Add/edit/delete functionality works

4. VISUAL FEEDBACK (Required):
   - Loading spinners when processing
   - Toast notifications for success/error
   - Animated transitions between states
   - Disabled states on buttons during loading
   - Progress bars for multi-step actions

5. REAL SCENARIOS (Required):
   - If it's a todo app: user can add, check, delete todos
   - If it's analytics: show charts with real-looking data
   - If it's social: show posts user can like/comment
   - If it's productivity: timer/pomodoro that works
   - If it's finance: calculator that computes

FORBIDDEN:
- Static pages with no interactions
- Buttons that do nothing
- Empty states with no demo data
- Forms without submit handlers
- "Coming soon" or placeholder sections"""

new_func_rules = """CRITICAL - EVERY MVP MUST BE A FULLY WORKING PRODUCT (not a demo/prototype):

1. ZERO DEAD ENDS — every UI element must work:
   - Every button MUST have a working onClick that changes visible state
   - Every nav link MUST switch to a real view with real content
   - Every form MUST submit, validate, and show results
   - Every modal MUST open AND close properly
   - Every delete button MUST remove the item with animation
   - Every search/filter MUST actually filter the displayed list
   - NEVER use alert() — use inline toast/notification components

2. FULL STATE MANAGEMENT — app must feel alive:
   - useState for ALL interactive elements (no exceptions)
   - Items can be Created, Read, Updated, and Deleted (full CRUD)
   - Search/filter state that filters items in real-time as user types
   - Sort functionality (by date, name, status, priority, etc.)
   - Toggle between list/grid view where appropriate
   - Tab navigation state to switch between views
   - Form state with validation (required fields, format checks)
   - localStorage.setItem/getItem to persist data across page refreshes

3. REALISTIC DEMO DATA — must look like a real product in use:
   - 10-15 pre-populated items with realistic, diverse data
   - Real names (Sarah Chen, Marcus Johnson, Emily Rodriguez — NOT User 1, User 2)
   - Real dates (2024-03-15, 2024-04-02 — NOT placeholder or today)
   - Real prices ($49.99, $12,500 — NOT $0 or $XX.XX)
   - Real descriptions (2-3 sentences of actual content — NOT Lorem ipsum)
   - Mixed statuses (active, pending, completed, cancelled — shows variety)
   - Demo data must be diverse: different categories, different values, different states

4. COMPLETE TAB VIEWS — every nav tab must render a full page:
   - HOME tab: Main content with item list/grid, add button, search bar
   - DASHBOARD tab: Stats cards (total items, completed %, recent activity), summary using pure CSS/SVG bars, activity timeline
   - PROFILE/SETTINGS tab: User avatar placeholder, display name, email, theme toggle (dark/light), notification prefs with working toggles, export data button
   - Each tab must have AT LEAST 3 interactive elements

5. WORKING FEATURES — not just UI mockups:
   - Search bar: filters items as user types (items.filter(i => i.title.toLowerCase().includes(query)))
   - Sort dropdown: changes item order (by date, by name, by status)
   - Status filters: click to show only items with a specific status
   - Counters update when items are added/deleted
   - Dashboard stats recalculate based on actual items array
   - Dark mode toggle actually switches all colors via CSS class or state
   - Export button copies data to clipboard or downloads as JSON

6. VISUAL FEEDBACK FOR EVERY ACTION:
   - Loading: skeleton shimmer for initial load, inline spinner on buttons during actions
   - Success: green toast slides in from bottom-right, auto-dismisses after 3s
   - Error: red toast with error message
   - Delete: item fades out before removal (300ms transition)
   - Add: new item slides in at top of list
   - Buttons: disabled + spinner during async operations
   - Form validation: red border + message on invalid, green on valid

ABSOLUTELY FORBIDDEN (will fail quality check):
- Static pages with no interactions
- Buttons that do nothing (onClick={() => {} is NOT acceptable)
- href="#" or href="/page" links (MUST use state-based navigation)
- Empty states with no demo data on first load
- Forms without submit handlers
- "Coming soon", "Under construction", "TODO" sections
- Placeholder text: "Lorem ipsum", "Sample text", "Description here"
- More than 1-2 placeholder items maximum in the entire app
- Modals/drawers that do not close when clicking outside or pressing X
- console.log as the only action on button click"""

if old_func_rules in content:
    content = content.replace(old_func_rules, new_func_rules)
    changes += 1
    print('1. Upgraded FUNCTIONALITY_RULES')
else:
    print('WARNING: Could not find FUNCTIONALITY_RULES')

# ======== 2. UPGRADE SAMPLE_INTERACTIONS ========
old_sample_start = "EXAMPLE PATTERNS TO USE:"
old_sample_end = """// Success toast
{success && (
  <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg animate-slide-up">
    ✅ Action completed!
  </div>
)}"""

new_sample = """REQUIRED PATTERNS — use ALL of these in every app:

// ===== TAB NAVIGATION (MANDATORY) =====
const [activeTab, setActiveTab] = useState("home")
// In navbar: onClick={() => setActiveTab("dashboard")} — NEVER href="#"
// Render: {activeTab === "home" && <HomeView />} {activeTab === "dashboard" && <DashboardView />}

// ===== SEARCH + FILTER (MANDATORY) =====
const [searchQuery, setSearchQuery] = useState("")
const [statusFilter, setStatusFilter] = useState("all")
const [sortBy, setSortBy] = useState("date")

const filteredItems = items
  .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  .filter(item => statusFilter === "all" || item.status === statusFilter)
  .sort((a, b) => sortBy === "date" ? b.date.localeCompare(a.date) : a.title.localeCompare(b.title))

// ===== FULL CRUD (MANDATORY) =====
const addItem = (data) => { setItems([{ id: Date.now().toString(), ...data, date: new Date().toISOString().split("T")[0] }, ...items]); showToast("Added successfully", "success") }
const deleteItem = (id) => { setItems(items.filter(i => i.id !== id)); showToast("Deleted", "success") }
const updateItem = (id, updates) => { setItems(items.map(i => i.id === id ? {...i, ...updates} : i)); showToast("Updated", "success") }
const toggleStatus = (id) => { setItems(items.map(i => i.id === id ? {...i, status: i.status === "active" ? "completed" : "active"} : i)) }

// ===== DATA PERSISTENCE (MANDATORY) =====
useEffect(() => { const saved = localStorage.getItem("app-items"); if (saved) setItems(JSON.parse(saved)) }, [])
useEffect(() => { localStorage.setItem("app-items", JSON.stringify(items)) }, [items])

// ===== DASHBOARD STATS (MANDATORY for dashboard tab) =====
const stats = {
  total: items.length,
  active: items.filter(i => i.status === "active").length,
  completed: items.filter(i => i.status === "completed").length,
  completionRate: Math.round((items.filter(i => i.status === "completed").length / Math.max(items.length, 1)) * 100),
}

// ===== DARK MODE (MANDATORY for settings tab) =====
const [darkMode, setDarkMode] = useState(false)
useEffect(() => { document.documentElement.classList.toggle("dark", darkMode) }, [darkMode])

// ===== TOAST NOTIFICATIONS =====
const [toast, setToast] = useState(null)
const showToast = (message, type = "success") => { setToast({message, type}); setTimeout(() => setToast(null), 3000) }

// ===== EXPORT DATA =====
const exportData = () => { navigator.clipboard.writeText(JSON.stringify(items, null, 2)); showToast("Data copied to clipboard") }

// ===== FORM WITH VALIDATION =====
const [formErrors, setFormErrors] = useState({})
const validateForm = () => {
  const errors = {}
  if (!formData.title.trim()) errors.title = "Title is required"
  if (!formData.description.trim()) errors.description = "Description is required"
  setFormErrors(errors)
  return Object.keys(errors).length === 0
}"""

if old_sample_end in content:
    # Find the full old sample block
    start_idx = content.find(old_sample_start)
    end_idx = content.find(old_sample_end) + len(old_sample_end)
    if start_idx != -1:
        content = content[:start_idx] + new_sample + content[end_idx:]
        changes += 1
        print('2. Upgraded SAMPLE_INTERACTIONS')
else:
    print('WARNING: Could not find SAMPLE_INTERACTIONS end marker')


# ======== 3. UPGRADE MANDATORY PATTERNS in buildWebApp ========
old_patterns = """MANDATORY PATTERNS (code MUST contain ALL of these):
1. page.tsx MUST start with 'use client' and import { useState } from 'react'
2. page.tsx MUST have: const [items, setItems] = useState([{...}, {...}, ...]) with 8+ REALISTIC pre-populated objects (real names like "Sarah Chen", real dates like "2024-03-15", real prices like "$49.99")
3. page.tsx MUST have 3+ onClick handlers that call setState functions
4. page.tsx MUST have an onSubmit handler for adding new items
5. page.tsx MUST have: const [loading, setLoading] = useState(false) and show a spinner/skeleton when loading
6. page.tsx MUST have delete function: setItems(items.filter(i => i.id !== id))
7. page.tsx MUST have toast/notification feedback on actions
8. NEVER use "Lorem ipsum", "placeholder", "TODO:", "example text", "Item 1", "Item 2"
9. Every button MUST have an onClick that does something real (not empty)
10. All components must have 'use client' directive
11. MUST have an empty state component: when items.length === 0, show a friendly message + icon + "Add your first..." CTA button
12. MUST be responsive: use grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 for card layouts"""

new_patterns = """MANDATORY PATTERNS — THE APP MUST BE FULLY FUNCTIONAL (code MUST contain ALL of these):
1. page.tsx MUST start with 'use client' and import { useState, useEffect } from 'react'
2. page.tsx MUST have: const [items, setItems] = useState([{...}, {...}, ...]) with 10-15 REALISTIC pre-populated objects (real names like "Sarah Chen", real dates like "2024-03-15", real prices like "$49.99", real descriptions of 2+ sentences)
3. page.tsx MUST have 5+ onClick handlers that call setState functions — every single button must do something visible
4. page.tsx MUST have an onSubmit handler with form validation (required fields check, error messages below inputs)
5. page.tsx MUST have: const [loading, setLoading] = useState(false) and show skeleton shimmer on initial load
6. page.tsx MUST have delete: setItems(items.filter(i => i.id !== id)) with fade-out animation
7. page.tsx MUST have toast notifications: const [toast, setToast] = useState(null) — slide in from bottom-right
8. NEVER use "Lorem ipsum", "placeholder", "TODO:", "Coming soon", "Under construction", "example text", "Item 1", "Item 2", "Description here", "Your text"
9. Every button MUST have an onClick that changes visible state (not empty, not console.log only)
10. All components must have 'use client' directive
11. MUST have empty state when items.length === 0: friendly icon + message + "Add your first..." CTA
12. MUST be responsive: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 for card layouts"""

if old_patterns in content:
    content = content.replace(old_patterns, new_patterns)
    changes += 1
    print('3. Upgraded MANDATORY PATTERNS')
else:
    print('WARNING: Could not find MANDATORY PATTERNS')


# ======== 4. ADD ADDITIONAL MANDATORY RULES after rule 14 ========
old_rule14_block = """14. Forms MUST have labels above inputs, placeholder examples, and inline validation

FILES:"""

new_rule14_block = """14. Forms MUST have labels above inputs, placeholder examples, and inline validation (red border + error msg)
15. MUST have search/filter: const [searchQuery, setSearchQuery] = useState("") with items.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()))
16. MUST have sort: const [sortBy, setSortBy] = useState("date") with dropdown to change sort order
17. MUST persist data with localStorage: useEffect(() => localStorage.setItem("items", JSON.stringify(items)), [items])
18. MUST have a Dashboard tab view showing: total items count, completion rate %, items by status breakdown, recent activity list
19. MUST have a Settings/Profile tab view with: dark mode toggle that works, user display name input, export data button that copies JSON to clipboard
20. FORBIDDEN: href="#", href="/page", onClick={() => {}, console.log-only handlers, alert(), "Coming soon" sections, empty onClick handlers

FILES:"""

if old_rule14_block in content:
    content = content.replace(old_rule14_block, new_rule14_block)
    changes += 1
    print('4. Added rules 15-20')
else:
    print('WARNING: Could not find rule 14 block')


# ======== 5. UPGRADE FUNCTIONALITY TESTS - add new checks ========
old_test_check = """  const passedCount = tests.filter(t => t.passed).length;
  return { passed: passedCount >= 6, tests };
}


async function runBackendTests"""

new_test_check = r"""  // Test 11: Has search/filter functionality
  const hasSearch = allFileContents.includes("searchQuery") || allFileContents.includes("filterQuery") || (allFileContents.includes("search") && allFileContents.includes(".filter(") && allFileContents.includes(".includes("));
  tests.push({
    name: "Has search/filter",
    passed: hasSearch,
    details: hasSearch ? "\u2713 Search works" : "\u2717 No search functionality",
  });

  // Test 12: Has tab navigation
  const hasTabNav = allFileContents.includes("activeTab") || allFileContents.includes("currentTab") || allFileContents.includes("activeView") || allFileContents.includes("currentView");
  tests.push({
    name: "Has tab navigation",
    passed: hasTabNav,
    details: hasTabNav ? "\u2713 Working tabs" : "\u2717 No tab navigation",
  });

  // Test 13: Has data persistence
  const hasPersistence = allFileContents.includes("localStorage") || allFileContents.includes("sessionStorage") || allFileContents.includes("AsyncStorage");
  tests.push({
    name: "Has data persistence",
    passed: hasPersistence,
    details: hasPersistence ? "\u2713 Data persists" : "\u2717 Data lost on refresh",
  });

  // Test 14: No dead links
  const hasDeadLinks = /href=["']#["']/.test(allFileContents) || /href=["']\/(?:dashboard|profile|settings|about|contact)["']/.test(allFileContents);
  tests.push({
    name: "No dead links",
    passed: !hasDeadLinks,
    details: !hasDeadLinks ? "\u2713 All links work" : "\u2717 Has dead href=# or href=/page links",
  });

  const passedCount = tests.filter(t => t.passed).length;
  return { passed: passedCount >= 9, tests };
}


async function runBackendTests"""

if old_test_check in content:
    content = content.replace(old_test_check, new_test_check)
    changes += 1
    print('5. Added 4 new functionality tests + raised passing bar to 9/14')
else:
    print('WARNING: Could not find test check block')


# ======== 6. UPGRADE fixFailedTests threshold ========
old_threshold = '  const funcPassed = funcResults.tests.filter(t => t.passed).length;\n  if (funcPassed >= 6) return; // Good enough'
new_threshold = '  const funcPassed = funcResults.tests.filter(t => t.passed).length;\n  if (funcPassed >= 10) return; // Require high quality — at least 10/14 tests must pass'

if old_threshold in content:
    content = content.replace(old_threshold, new_threshold)
    changes += 1
    print('6. Raised fix threshold from 6 to 10')
else:
    print('WARNING: Could not find fix threshold')


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'\nDone! Applied {changes}/6 changes to {filepath}')
