# Sprint 12 Contract — Bot Evolution Visuals

## Feature
4 evolution stages for the bot orb tied to player level, with transition animations.

## Acceptance Criteria
1. Level 1-5: Simple orb (current look — clean, minimal)
2. Level 6-15: Orb with features (inner ring patterns, secondary glow layer)
3. Level 16-30: Detailed character (orbital particles, crown/halo element, richer gradients)
4. Level 31+: Legendary appearance (multi-layered aura, golden accents, pulsing energy field)
5. Smooth evolution transition animation when crossing a threshold
6. Works on both web canvas renderer and maintains type safety

## Technical Approach
- Add `evolutionStage` derived from level in GameState or computed in renderer
- Extend `drawBot` and `drawBotGlow` with stage-specific rendering layers
- Add evolution transition state (flash + morph animation when leveling into new stage)
- Keep existing bot mechanics intact — evolution is purely visual

## Out of Scope
- Server-side evolution tracking (purely client-side visual)
- Mobile app changes (web only for this sprint)
