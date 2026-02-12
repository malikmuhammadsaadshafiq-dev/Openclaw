# Mobile App Builder Skill

## Description
Autonomous mobile app generator that builds React Native apps with Expo. Creates complete, working mobile MVPs and publishes them to Expo Go for instant testing on any device.

## Metadata
```yaml
name: mobile-builder
version: 1.0.0
author: MVPFactory
requiredEnv:
  - NVIDIA_API_KEY
  - GITHUB_TOKEN
  - EXPO_TOKEN
stateDirs:
  - mobile-projects
```

## Tech Stack
- **Framework**: React Native with Expo SDK 50+
- **Routing**: Expo Router (file-based)
- **Styling**: NativeWind (TailwindCSS for React Native)
- **State**: Zustand
- **Backend**: Supabase
- **Icons**: Expo Vector Icons

## Tools

### `generate_mobile_app`
Creates complete Expo project from idea specification.

### `generate_screen`
Generates individual screens/pages.

### `generate_component`
Creates reusable React Native components.

### `publish_to_expo`
Publishes the app to Expo Go for testing.

### `push_to_github`
Creates repo and pushes the complete project.

## Instructions

When receiving a mobile idea:

1. **Generate Expo Project**
   - Create Expo Router file structure
   - Set up NativeWind styling
   - Configure navigation

2. **Build All Screens**
   - Generate each screen as a route
   - Create reusable components
   - Implement all features

3. **Style & Polish**
   - Modern, native-feeling UI
   - Proper touch feedback
   - Loading states
   - Error handling

4. **Publish**
   - Run `eas update` to publish
   - Generate QR code for Expo Go
   - Push to GitHub

## Triggers
- Queue: When mobile idea added
- Manual: `/build-mobile <idea-id>`
