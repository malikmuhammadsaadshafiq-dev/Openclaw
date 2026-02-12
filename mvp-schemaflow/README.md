# 🔄 SchemaFlow

<div align="center">

![Category](https://img.shields.io/badge/Category-Web%20Developer%20Tool-purple?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js%2014%20%7C%20React%2018%20%7C%20TypeScript%20%7C%20Tailwind%20CSS-black?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green?style=for-the-badge)

**Interactive visualizer that converts JSON API responses into editable node diagrams and auto-generates TypeScript interfaces.**

[Live Demo](#) • [Features](#-features) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack)

</div>

---

## 📋 Overview

SchemaFlow is a developer productivity tool that transforms raw JSON data into visual node diagrams and automatically generates type-safe TypeScript interfaces. Perfect for API development, documentation, and type definition workflows.

### Key Value Propositions
- 🎨 **Visual Schema Editor** - Drag, drop, and edit your data structure visually
- ⚡ **Instant TypeScript Generation** - One-click interface output with proper typing
- 🔧 **Interactive Nodes** - Add, delete, and modify fields in real-time
- 📋 **Copy to Clipboard** - Instantly copy generated interfaces to your codebase

---

## ✨ Features

### Core Functionality
- ✅ **JSON Parser** - Paste any JSON and see it converted to visual nodes
- ✅ **Type Detection** - Automatic type inference (string, number, boolean, object, array)
- ✅ **Field Management** - Add custom fields with type selection
- ✅ **Delete Operations** - Remove fields with smooth animations
- ✅ **TypeScript Output** - Generate clean, typed interfaces instantly
- ✅ **Clipboard Copy** - One-click copy for generated code

### UI/UX Highlights
- 🌙 **Glassmorphism Dark Theme** - Modern purple gradient with glass effects
- ✨ **Real-time Updates** - Instant visual feedback on all operations
- 🎨 **Smooth Animations** - Pulse effects and hover transitions
- 📱 **Responsive Layout** - Two-column grid for desktop, stacked for mobile

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/malikmuhammadsaadshafiq-dev/mvp-schemaflow.git

# Navigate to project directory
cd mvp-schemaflow

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **React 18** | UI component library with useState hooks |
| **TypeScript** | Type-safe development |
| **Tailwind CSS 3.4** | Utility-first styling with custom config |
| **PostCSS** | CSS transformations |

---

## 📁 Project Structure

```
mvp-schemaflow/
├── src/
│   └── app/
│       ├── page.tsx        # Main application with JSON parser and node editor
│       ├── layout.tsx      # Root layout with metadata
│       └── globals.css     # Tailwind imports
├── package.json            # Dependencies and scripts
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
├── postcss.config.js       # PostCSS configuration
└── next.config.js          # Next.js configuration
```

---

## 💡 Example Usage

### Input JSON
```json
{
  "id": 123,
  "username": "johndoe",
  "email": "john@example.com",
  "isActive": true
}
```

### Generated TypeScript
```typescript
interface Schema {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
}
```

---

## 🎯 Use Cases

1. **Backend Developers** - Generate TypeScript types from API responses
2. **Frontend Teams** - Create type definitions for API integrations
3. **Technical Writers** - Document API schemas visually
4. **Prototypers** - Quickly model data structures
5. **Students** - Learn JSON structure and TypeScript typing

---

## 📈 Roadmap

- [ ] Export to Zod/Yup validation schemas
- [ ] Support for nested object visualization
- [ ] Array type element typing
- [ ] Import from URL (fetch JSON directly)
- [ ] Dark/Light theme toggle
- [ ] Save schemas to local storage

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
<strong>Built with ❤️ by MVP Factory</strong>
</div>
