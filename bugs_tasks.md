# Bug 3: Team Selector Should Be Text Input for Games

## Root Cause
Game team selection uses `BlockSelector` (horizontal card scroll) for home team. But games are against external teams — users need free text input, not a picker from internal classes. Cards also look crooked and are hard to scroll on mobile.

## Fix
- Remove internal/external toggle — all games use text inputs
- Home team: text input
- Away team: text input
- Keep `BlockSelector` only for training flow (trainer + class selection)
