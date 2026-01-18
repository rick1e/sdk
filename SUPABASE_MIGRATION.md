# Supabase Migration Guide

## Overview
This document outlines the migration from SQLite to Supabase for the Kalooki game persistence system.

## Changes Made

### 1. Dependencies Updated
- Removed: `sqlite3`
- Added: `@supabase/supabase-js`, `dotenv`

### 2. Environment Variables
Create a `.env` file based on `.env.example`:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=4000
NODE_ENV=development
```

### 3. Database Layer
- `server/database.js` completely rewritten to use Supabase
- All database operations now use Supabase client API
- JSONB storage for game states (PostgreSQL native JSON)

### 4. Supabase Setup
Run the SQL in `server/supabase-setup.sql` in your Supabase SQL Editor to create the required table.

## API Compatibility
The migration maintains 100% API compatibility with the existing persistence layer. No changes needed in:
- `server/persistence.js`
- `server/index.js`
- Any game logic

## Database Operations Mapping

| SQLite Operation | Supabase Operation |
|------------------|-------------------|
| `INSERT OR REPLACE` | `supabase.from().upsert()` |
| `SELECT ... WHERE` | `supabase.from().select().eq()` |
| `UPDATE ... SET` | `supabase.from().update().eq()` |
| `DELETE ... WHERE` | `supabase.from().delete().eq()` |

## Benefits of Supabase

1. **Cloud-native**: No local file management
2. **Scalable**: PostgreSQL with automatic scaling
3. **Real-time**: Built-in realtime subscriptions available
4. **Multi-region**: Automatic global distribution
5. **Backup**: Automatic backups and point-in-time recovery
6. **Security**: Row-level security policies
7. **Monitoring**: Built-in analytics and monitoring
8. **API**: RESTful API with auto-generated documentation

## Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Set Up Database
1. Open Supabase SQL Editor
2. Run the SQL from `server/supabase-setup.sql`
3. Verify the `games` table is created

### 3. Configure Environment
1. Copy `.env.example` to `.env`
2. Fill in your Supabase URL and anon key
3. Adjust other settings as needed

### 4. Start Server
```bash
npm start
```

## Migration Notes

### Data Migration
If you have existing SQLite games you want to preserve:
1. Export your SQLite data
2. Import into Supabase using the upsert operations
3. The JSON structure remains identical

### Performance
- Slightly higher latency than local SQLite
- Better scalability and reliability
- Automatic connection pooling

### Error Handling
- Supabase errors have different codes than SQLite
- All error handling updated to handle Supabase error format
- Graceful fallback for connection issues

## Testing

After migration, test:
1. Game creation and persistence
2. Game loading and recovery
3. Bot recreation
4. Timer state preservation
5. Cleanup operations

## Troubleshooting

### Common Issues

1. **Connection Error**: Check SUPABASE_URL and SUPABASE_ANON_KEY
2. **Table Not Found**: Run the setup SQL in Supabase dashboard
3. **Permission Error**: Check RLS policies in Supabase
4. **Environment Variables**: Ensure `.env` file is properly configured

### Error Codes
- `PGRST116`: Table not found (run setup SQL)
- `PGRST301`: Relation does not exist (check table name)
- `JWT`: Invalid API key (check environment variables)

## Production Considerations

1. **Security**: Review RLS policies for production
2. **Scaling**: Monitor Supabase usage and limits
3. **Backups**: Supabase handles automatic backups
4. **Monitoring**: Use Supabase dashboard for monitoring
5. **Cost**: Review Supabase pricing for your usage

## Future Enhancements

With Supabase, you can now easily add:
1. **Real-time game updates** using Supabase subscriptions
2. **User authentication** with Supabase Auth
3. **File storage** for game assets
4. **Edge functions** for server-side logic
5. **Analytics** and reporting