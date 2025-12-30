# MongoDB Setup Guide for KhataX

## Database Configuration

KhataX now uses **Mongoose** with **MongoDB** for data persistence.

## Environment Variables

Add to your `.env.local` file:

```env
MONGODB_URI=mongodb://localhost:27017/khatax
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/khatax?retryWrites=true&w=majority
```

## Database Schemas

All Mongoose schemas are defined in the `models/` directory:

### 1. User Model (`models/User.ts`)
- Stores user account information
- Fields: name, dept, institute, phone, email, picture, googleId, role
- Indexes: email (unique), googleId (unique, sparse)

### 2. Member Model (`models/Member.ts`)
- Stores member financial data
- References User via `userId`
- Fields: totalDeposit, previousDue, perExtra, totalExpense, balanceDue, border, managerReceivable
- Index: userId (unique)

### 3. DailyExpense Model (`models/DailyExpense.ts`)
- Stores daily expense records
- References User via `addedBy`
- Fields: date, bazarShop, bazarListUpload, totalTK, extra, notes
- Indexes: date (descending), addedBy

### 4. BazarList Model (`models/BazarList.ts`)
- Stores auto-generated bazar schedule
- References User via `assignedTo`
- Fields: bazarNo, date, status
- Indexes: date (descending), assignedTo, bazarNo

### 5. Transaction Model (`models/Transaction.ts`)
- Stores transaction history
- References User via `userId`
- Fields: type, amount, date, description
- Indexes: userId, date (descending), type

### 6. SemesterBreak Model (`models/SemesterBreak.ts`)
- Stores semester break periods
- Fields: startDate, endDate, description
- Index: startDate, endDate

## Database Connection

The database connection is handled in `lib/db.ts` using connection pooling to prevent multiple connections in development.

## API Routes Updated

All API routes now use Mongoose models:

- ✅ `/api/auth/register` - Creates user and member records
- ✅ `/api/auth/check-user` - Checks if user exists
- ✅ `/api/members` - CRUD operations for members
- ✅ `/api/members/me` - Get current user's member data
- ✅ `/api/expenses` - CRUD operations for expenses
- ✅ `/api/bazar` - Get bazar list
- ✅ `/api/bazar/generate` - Generate bazar schedule
- ✅ `/api/bazar/[id]/send-email` - Send bazar reminder email
- ✅ `/api/settlement/calculate` - Calculate monthly settlement
- ✅ `/api/invoices/send-bulk` - Send bulk invoices

## Setup Steps

1. **Install MongoDB locally** or use MongoDB Atlas (cloud)

2. **Set MONGODB_URI in `.env.local`:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/khatax
   ```

3. **Start MongoDB:**
   ```bash
   # If installed locally
   mongod
   ```

4. **Run the application:**
   ```bash
   npm run dev
   ```

## Database Operations

### Create User
When a user registers via Google login, the system:
1. Creates a User document
2. Creates a Member document linked to the User

### Calculate Settlement
The settlement calculation:
1. Fetches all members
2. Calculates: `netBalance = totalDeposit + perExtra - totalExpense`
3. Sets `border = netBalance` if positive, else 0
4. Sets `managerReceivable = abs(netBalance)` if negative, else 0
5. Updates all member documents

### Generate Bazar Schedule
The bazar scheduler:
1. Fetches all members (Member role only)
2. Fetches semester breaks
3. Generates schedule with 4-day gaps, skipping breaks
4. Saves all bazar assignments to database

## Notes

- All models use Mongoose's `timestamps: true` for createdAt/updatedAt
- Relationships use `populate()` for efficient queries
- Indexes are set for common query patterns
- Connection pooling prevents multiple connections in development

