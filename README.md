# CASHORBIT2

A modern React-based web application built with Vite, Tailwind CSS, and Supabase.

## Repository

**GitHub:** [https://github.com/malariachrome-lab/CASHORBIT2](https://github.com/malariachrome-lab/CASHORBIT2)

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand + React Context
- **Backend/Auth:** Supabase
- **Animation:** Framer Motion
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/malariachrome-lab/CASHORBIT2.git

# Navigate to project directory
cd CASHORBIT2

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
vercel --prod
```

Or connect the GitHub repository directly at [vercel.com](https://vercel.com) for automatic deployments.

### Deploy to Netlify

```bash
# Install Netlify CLI (if not already installed)
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

Or connect the GitHub repository directly at [netlify.com](https://netlify.com) for automatic deployments.

## Live Demo

*Coming soon — deploy using the commands above to get your live link!*

## Project Structure

```
CASHORBIT2/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React context providers
│   ├── lib/            # Utility libraries (Supabase client)
│   ├── pages/          # Route-level page components
│   ├── services/       # API and business logic services
│   ├── App.jsx         # Main application component
│   ├── index.css       # Global styles
│   └── main.jsx        # Application entry point
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## License

Private — All rights reserved.
