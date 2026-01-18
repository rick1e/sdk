# Game Persistence Implementation

## Overview
The Kalooki game now includes full persistence using SQLite, allowing:
- **Server restart recovery** - Games survive server restarts
- **Session recovery** - Players can reconnect after disconnections  
- **Data integrity** - All game states are automatically saved

## Architecture

### Database Layer (`server/database.js`)
- SQLite database with single `games` table
- JSON storage for complete game state
- Async/await interface with Promise-based API
- Automatic table creation and connection management

### Persistence Layer (`server/persistence.js`)
- Game state serialization/deserialization
- Data validation and sanitization
- Bot instance recreation on load
- Graceful error handling and recovery

### Integration Points
All game actions now automatically persist:
- ✅ Game creation/joining
- ✅ Player moves (draw, discard, meld)
- ✅ Game state changes
- ✅ Bot actions
- ✅ Session reconnection

## Database Schema
```sql
CREATE TABLE games (
    game_id TEXT PRIMARY KEY,
    game_state TEXT NOT NULL,           -- JSON of complete game state
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1         -- Cleanup flag for finished games
);
```

## Key Features

### 1. Automatic Game Recovery
- Server loads all active games on startup
- Bot instances recreated automatically
- Players can reconnect via `rejoin_game` event
- Full game state restoration with validation

### 2. Real-time Persistence
- Every game action saves immediately
- Periodic auto-save every 5 minutes
- Batch cleanup of old games (7 days)
- Graceful shutdown saves all states

### 3. Session Recovery
- Players can rejoin with just game ID + player name
- Socket IDs automatically updated
- Bot players preserved and reactivated
- Game phase and timers maintained

## Usage Examples

### Server Startup
```javascript
// Games automatically loaded from database
// Bot instances recreated
// Server ready with all previous sessions
```

### Player Reconnection
```javascript
// Client can reconnect with:
socket.emit('rejoin_game', {
    gameId: 'abc123',
    playerName: 'PlayerName'
});
```

### Manual Cleanup (Optional)
```javascript
// Cleanup old games
await persistence.cleanupOldGames(7); // 7 days old
```

## File Structure
```
server/
├── database.js      # SQLite connection and queries
├── persistence.js   # Game serialization and business logic
├── index.js        # Updated with persistence integration
└── data/
    └── kalooki.db  # SQLite database file (auto-created)
```

## Error Handling
- Database failures don't crash the server
- Corrupted game states automatically marked inactive
- Graceful degradation if database unavailable
- Comprehensive error logging

## Performance
- Minimal overhead - saves only when state changes
- Efficient JSON serialization
- Periodic batch operations
- SQLite optimized for single-file operations

## Migration Path
This implementation provides a foundation for:
- Multi-server deployment (migrate to PostgreSQL)
- Player accounts and authentication
- Game history and statistics
- Advanced analytics and reporting

## Testing
Persistence has been verified with:
- Game creation/loading cycles
- Player reconnection scenarios
- Bot recreation testing
- Data integrity validation
- Server restart recovery

The persistence implementation is production-ready and provides robust session recovery with minimal performance impact.