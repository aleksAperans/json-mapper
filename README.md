# JSON Mapper

A developer-focused JSON viewer with seamless path mapping integration for instantly copying and sharing precise data paths.

## Features

- 🌳 **Tree View** - Collapsible nested JSON structure visualization
- 📋 **JMESPath Copy** - Click-to-copy path functionality with keyboard shortcuts
- 🎨 **Syntax Highlighting** - Color-coded JSON elements with dark/light theme
- 🔍 **Search** - Find keys and values with navigation between results
- 📥 **Multiple Import Methods** - File upload, paste from clipboard, fetch from URL

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## Tech Stack

- **Frontend**: React + TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library
- **JMESPath**: jmespath.js

## Usage

1. Import JSON data using one of three methods:
   - Upload a JSON file
   - Paste from clipboard (Cmd/Ctrl + V)
   - Fetch from a URL

2. Navigate through the JSON tree structure

3. Click on any value to copy its JMESPath

4. Use search to find specific keys or values

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
