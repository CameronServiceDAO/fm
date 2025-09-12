# Fantasy Sports Platform - Frontend

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask or another Web3 wallet

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your actual values:
   - Get a WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com)
   - Add your deployed contract addresses

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes for FPL data
│   ├── admin/             # Admin pages (points sync)
│   ├── chips/             # Chip purchase page
│   ├── fixtures/          # Match fixtures
│   ├── leaderboard/       # Player rankings
│   ├── market/            # Player market
│   ├── players/           # Player details
│   ├── profile/           # User profile
│   ├── register/          # Registration flow
│   ├── squad/             # User's squad
│   ├── trade/             # Trading interface
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── layout/           # Header, Footer
│   ├── ui/               # UI components
│   └── wallet/           # Web3 wallet components
├── lib/                   # Utilities and services
│   ├── abis/             # Contract ABIs
│   ├── config/           # Configuration files
│   ├── contracts/        # Contract interactions
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services
│   └── utils/            # Helper functions
└── public/               # Static assets
```

## 🔧 Configuration Files

- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `next.config.mjs` - Next.js configuration
- `.eslintrc.json` - ESLint rules

## 🌐 Environment Variables

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect Project ID | `abc123...` |
| `NEXT_PUBLIC_FANTASY_CORE_ADDRESS` | Main contract address | `0x123...` |
| `NEXT_PUBLIC_POINTS_STORE_ADDRESS` | Points store contract | `0x456...` |
| `NEXT_PUBLIC_USDC_ADDRESS` | USDC token contract | `0x789...` |
| `NEXT_PUBLIC_CHAIN_ID` | Blockchain network ID | `11155111` |

## 🚢 Deployment

### Vercel Deployment

1. **Connect your GitHub repository to Vercel**

2. **Set the Root Directory to `frontend`** in Vercel project settings

3. **Add environment variables** in Vercel dashboard

4. **Deploy!**

### Manual Build

```bash
npm run build
npm start
```

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

## 📝 Key Features

- **Wallet Integration**: Rainbow Kit + Wagmi for Web3 connectivity
- **Player Trading**: Buy/sell player shares with bonding curves
- **Live FPL Data**: Real-time stats from Fantasy Premier League API
- **Points Syncing**: Admin interface to sync gameweek points on-chain
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## 🔗 Smart Contracts

The frontend interacts with three main contracts:
1. **FantasyCore**: Main game logic and trading
2. **GameweekPointsStore**: Player points storage
3. **MockUSDC**: Test token for development

## 🐛 Troubleshooting

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Check that environment variables are set correctly
- Verify TypeScript types: `npx tsc --noEmit`

### Vercel Deployment Issues
- Ensure Root Directory is set to `frontend`
- Check that all environment variables are added in Vercel
- Verify `package.json` has all required dependencies

### Web3 Connection Issues
- Check that WalletConnect Project ID is valid
- Ensure MetaMask is on the correct network
- Verify contract addresses are correct for the network

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Wagmi Documentation](https://wagmi.sh)
- [Rainbow Kit](https://www.rainbowkit.com/docs)
- [FPL API](https://fantasy.premierleague.com/api/)