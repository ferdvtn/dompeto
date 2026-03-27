# DOMPETO REVAMP - AI IMPLEMENTATION PROMPT

## PROJECT OVERVIEW
App: Personal Finance Tracker dengan AI Input
Platform: Mobile (iOS/Android, responsive)
Stack: Next.js + shadcn/ui + Recharts
Goal: Improve UX dengan charts, edit/delete, validation, daily metrics

---

## CORE FEATURES

### 1. DASHBOARD
- Balance card (saldo hari ini)
- Daily metrics (sticky top):
  * [N] transaksi hari ini
  * [N]/limit chat messages used hari ini
  * Auto reset 00:00
- Spending total hari ini
- Latest transactions list (preview)
- Button: "Tambah Transaksi"

### 2. AI INPUT + VALIDATION
User: "bakso 4rb" atau "invest 500k"
System:
- Parse amount, category, description
- If ambiguous → confirmation dialog
- Confirmation format:
  ```
  📌 [Category Name]
  💰 Rp [Amount]
  📅 [Date & Time]
  
  [Cancel] [Confirm]
  ```
- On confirm → save DB + update UI
- No foreign currency allowed (reject + show error)

### 3. TRANSACTION MANAGEMENT
List view:
- Grouped by date
- Swipe left → Edit, Delete options
- Edit modal: revise amount/category/date
- Delete: confirm dialog + 10sec undo timer
- Pull-to-refresh

### 4. CHARTS (4 TYPE)
a) Pie Chart
  - % breakdown per kategori hari ini/minggu/bulan
  - Click kategori → detail list

b) Bar Chart
  - Kategori vs total spending
  - Last 7/14/30 days

c) Line Chart
  - Daily spending trend
  - Toggle range (7/14/30 days)
  - Show avg line

d) Monthly Tracker (Salary Cycle)
  - "25 Mar - 24 Apr: Rp 506k spent / Rp 2M budget"
  - Progress bar + kategori breakdown
  - Reset setiap 25th

### 5. CATEGORIES
Hybrid: default (Makan & Minuman, Transport, Invest, THR kantor, dsb) + custom
- User bisa buat kategori custom
- Edit: name & icon (custom only)
- Delete: warn jika ada transaksi
- Optional: monthly budget per kategori

### 6. SETTINGS
- Budget preferences
- Category management
- Account settings

---

## UI REQUIREMENTS

### Layout
- Bottom tab navigation: Home | Charts | Categories | Settings
- Header: title + search/filter
- Input form: modal/sheet, not full page
- One-handed friendly (thumb-reachable buttons)

### Design
- Dark theme default
- Color code: income (green), expense (red)
- Icons: dari lucide-react untuk setiap kategori
- Consistent spacing & typography (Tailwind)
- Loading states: skeleton loaders
- Toast: success/error feedback
- Empty states: designed

### Mobile
- Min 375px width support
- Landscape support
- 44x44px touch targets minimum
- No horizontal scroll
- Notch/safe area aware

### Performance
- Lazy load charts
- Infinite scroll untuk list panjang
- Memoize expensive components
- Optimistic UI updates

---

## DATA MODEL

```
TRANSACTION
- id, userId
- description, amount (IDR only), category
- date, createdAt, updatedAt
- aiConfirmed (boolean)

CATEGORY
- id, userId, name, icon, isDefault
- monthlyBudget (optional)

DAILY_STATS (reset 00:00)
- userId, date
- transactionCount
- chatMessagesUsed
- totalSpent
```

---

## SHADCN/UI COMPONENTS
Button, Input, Form, Dialog, Sheet, Card, Tabs, Select, DatePicker, Badge, Progress, Toast, Skeleton, Dropdown

---

## SCREENS TO BUILD
1. Dashboard (stats + latest txn)
2. Transaction List (edit/delete)
3. Input Modal (AI assistant)
4. Confirmation Dialog
5. Charts (Pie, Bar, Line, Monthly)
6. Categories Management
7. Settings
8. Edit Transaction Modal
9. Delete Confirmation

---

## KEY FLOWS

**INPUT FLOW:**
User Input → AI Parse → Ambiguity Check? → YES: Confirmation Dialog / NO: Save to DB → Update UI + Toast

**EDIT FLOW:**
Swipe Edit → Modal Open → Change fields → Save → Update UI

**DELETE FLOW:**
Swipe Delete → Confirm Dialog → Delete → Undo option (10s) → Remove from DB

---

## CONSTRAINTS
- IDR only (no currency conversion)
- Mobile-first design
- Clean, minimal UI
- Best practice UX patterns
- Accessibility: WCAG AA minimum
- No hardcoded colors (use Tailwind CSS variables)
