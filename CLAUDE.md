# PIXI.js V7 Game Demo Project

## Project Overview
This is a demo project for an HTML5 game using the pixi.js V7 engine. The game will feature a main menu scene and three demo scenes, all designed to be responsive and work on both desktop and mobile devices.

## Assistant Instructions
- **Always use sequential thinking** for complex problem-solving and planning
- **Always use context7** to refer to pixi.js documentation: https://context7.com/pixijs/pixijs/v7_4_3
- Focus on code quality and cleanliness
- Document code as we go and write unit tests for most functions
- Prefer editing existing files over creating new ones

## Technical Requirements

### Development Environment
- **TypeScript**: Strict configuration with type checking
- **ESLint**: Strict ruleset including no unchained promises, no null assertions
- **Prettier**: Consistent code styling
- **Webpack**: Code bundling with development server and hot reload
- **Jest**: Unit testing framework
- **Texture Atlas Tool**: For optimizing sprite assets

### Project Structure
```
pixi7-tests/
├── src/           # TypeScript source code
├── serve/         # Development server tools
├── build/         # Production builds
├── assets/        # Images, bitmap fonts, etc.
└── tests/         # Unit tests
```

### Core Features
1. **Responsive Design**: Must work on desktop and mobile
2. **Debug Menu**: Always visible in top-left corner showing:
   - FPS counter
   - Current scene name
   - Total sprites in scene count
   - Other useful debugging info
3. **Scene Controls**: Navigation buttons to switch between scenes
4. **General Controls**: Enter/exit fullscreen functionality

## Game Scenes

### Main Menu Scene
- Navigation buttons to access each demo scene
- Clean, responsive design

### 1. "Ace of Shadows" Scene
- Create **144 sprites** (NOT graphic objects) stacked like cards in a deck
- Top card must cover bottom card but not completely
- Every 1 second, top card moves to different stack
- Movement animation takes 2 seconds to complete

### 2. "Magic Words" Scene
- Text and image combination system (custom emoji-like functionality)
- Render dialogue between characters using data from:
  `https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords`
- Dynamic text rendering with integrated images

### 3. "Phoenix Flame" Scene
- Particle effect demo showcasing fire effects
- Maximum 10 sprites on screen simultaneously
- Impressive visual fire particle system

## Development Workflow

### Phase 1: Environment Setup
1. Initialize package.json with required dependencies
2. Install and configure TypeScript, ESLint, Prettier
3. Setup Webpack with development server
4. Install pixi.js V7 (latest stable version)
5. Create project folder structure
6. Verify setup with basic sprite demo

### Phase 2: Core Systems
1. Implement scene management system
2. Create debug menu component
3. Add responsive design foundation
4. Implement navigation system

### Phase 3: Scene Implementation
1. Build main menu with scene navigation
2. Implement "Ace of Shadows" card animation system
3. Create "Magic Words" text/image rendering system
4. Develop "Phoenix Flame" particle effects

### Phase 4: Polish & Testing
1. Add fullscreen controls
2. Optimize for mobile devices
3. Write comprehensive unit tests
4. Performance testing and optimization

## Quality Standards
- All code must be properly typed with TypeScript
- No ESLint errors or warnings
- Consistent formatting with Prettier
- Unit tests for all major functions
- Code documentation for complex logic
- Performance optimization for mobile devices

## Asset Management
- Use texture atlases for optimal performance
- Optimize all images for web delivery
- Support multiple screen densities
- Efficient loading and memory management

## Testing Strategy
- Unit tests for game logic
- Integration tests for scene transitions
- Performance testing on various devices
- Cross-browser compatibility testing