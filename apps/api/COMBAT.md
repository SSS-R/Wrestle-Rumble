# Combat System

## Overview
The combat system allows users to battle with their cards against AI opponents or other players.

## Battle Mechanics

### Score Calculation
```
Score = (Attack × 0.7 + Defense × 0.3) × Random(0.85-1.15)
```

### Rewards
| Outcome | Trophies | Coins |
|---------|----------|-------|
| Win | +15 (base) | +100 (base) |
| Loss | 0 | +25 (consolation) |

Rewards are multiplied by user level multiplier: `1 + (level × 0.05)`

## API Endpoints

### Start Battle
```
POST /api/combat/battle
{
    "user_card_id": 123,
    "opponent_id": null  // null for random opponent
}
```

### Get Leaderboard
```
GET /api/combat/leaderboard?limit=10
```

### Battle History
```
GET /api/combat/history?user_id=1&limit=20
```

## Database Models

- `Battle`: Stores battle results, scores, and rewards
- `User`: Tracks trophies and coins
- `UserCard`: User's card collection with active status

## Frontend Components

- `BattleArena.tsx`: Interactive battle UI with animations
- `LeaderboardScreen.tsx`: Rankings display
- `battle/page.tsx`: Card selection for battles
