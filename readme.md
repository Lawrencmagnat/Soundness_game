# 🎮 The Proof Collector

**A blockchain-themed arcade game where you verify cryptographic proofs!**

![Game Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

---

## 📖 About

The Proof Collector is an exciting arcade game where you play as Soundy, a blockchain validator collecting valid cryptographic proofs while avoiding fake ones. Navigate through an ever-changing field of proofs, build combos, and climb the ranks from Beginner to Legendary Prover!

### 🎯 Objective
- Collect **✓ Valid Proofs** (green) to earn points
- Avoid **✗ Fake Proofs** (red) to keep your lives
- Build combos for massive score multipliers
- Level up and become a legendary prover!

---

## ✨ Features

### 🎮 Core Gameplay
- **3 Game Modes**: Quick (3 min), Challenge (5 min), Endless
- **10 Levels**: Progressive difficulty with unique themes
- **Combo System**: Chain valid proofs for bonus points
- **Lives System**: Strategic gameplay with 5 lives
- **Dynamic Difficulty**: Spawning rate increases with level

### ⚡ Power-ups
- 🛡️ **Shield** - Protection from fake proofs (12s)
- ❄️ **Freeze** - Slows down time (6s)
- ⭐ **2x Points** - Double score multiplier (12s)
- 💛 **Extra Life** - One more chance
- 🔷 **Soundness Boost** - 2x combo multiplier (15s)
- 🧲 **Magnet** - Auto-attracts and collects valid proofs (10s)

### 🏆 Progression System
- **Rank System**: 7 ranks from Beginner to Legendary Prover
- **Achievement Badges**: Unlock achievements for milestones
- **High Score Tracking**: Persistent high score storage
- **Score History**: View your last 5 games

### 📱 Mobile Optimized
- Responsive design for all screen sizes
- Touch/swipe controls
- Haptic feedback on mobile
- Optimized performance

### 🎨 Visual & Audio
- Smooth animations with CSS transforms
- Particle effects on collections
- Dynamic level backgrounds
- Sound effects for actions
- Screen shake on combos
- Confetti celebrations

### 📤 Social Features
- Share score on Twitter
- Copy score to clipboard
- Download score card as image
- Challenge friends

---

## 🚀 Quick Start

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Basic web server (optional for local testing)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/proof-collector.git
cd proof-collector
```

2. **Open locally**
```bash
# Option 1: Open directly
open index.html

# Option 2: Use Python server
python -m http.server 8000

# Option 3: Use Node.js server
npx http-server
```

3. **Visit in browser**
```
http://localhost:8000/index.html
```

---

## 📁 Project Structure

```
proof-collector/
├── index.html          # Introduction/Instructions page
├── game.html           # Main game page
├── style.css           # Complete game styling
├── game.js             # Game logic and functionality
├── README.md           # This file
├── .gitignore          # Git ignore rules
└── LICENSE             # MIT License (optional)
```

---

## 🎮 How to Play

### Desktop Controls
- **Movement**: Arrow Keys or WASD
- **Pause**: P key or Pause button
- **Mute**: Toggle sound button

### Mobile Controls
- **Movement**: Swipe anywhere on the screen
- **Pause/Mute**: Touch buttons

### Scoring
- Valid Proof: **+10 points**
- Fake Proof: **-5 points & -1 life**
- Combo Bonus: **+5 points** per 5-combo milestone
- Magnet Bonus: **+5 points** for magnet collections

### Combo System
- 5x Combo: Bonus points activated
- 10x Combo: Screen shake + confetti
- 15x Combo: Mega combo notification
- 20x+ Combo: Legendary status

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Your game is live!**
```
https://your-game-name.vercel.app
```

### Deploy to Netlify

1. Drag and drop your folder to [Netlify Drop](https://app.netlify.com/drop)
2. Get instant deployment URL

### Deploy to GitHub Pages

1. Push to GitHub repository
2. Go to Settings → Pages
3. Select branch and deploy

---

## 🛠️ Technologies Used

- **HTML5** - Structure
- **CSS3** - Styling & animations
- **JavaScript (ES6+)** - Game logic
- **Web Audio API** - Sound effects
- **Canvas API** - Score card generation
- **Local Storage API** - Save high scores
- **Touch Events API** - Mobile controls
- **Vibration API** - Haptic feedback

---

## 🎯 Game Statistics

After each game, you'll see:
- Final score and rank
- Level reached
- Total moves (valid/fake)
- Best combo achieved
- Achievements unlocked
- Move history (last 15 moves)

---

## 📊 Ranking System

| Score Range | Rank |
|-------------|------|
| 2000+ | 👑 Legendary Prover |
| 1500-1999 | 💎 Diamond Auditor |
| 1000-1499 | 🥇 Gold Verifier |
| 600-999 | 🥈 Silver Validator |
| 300-599 | 🥉 Bronze Checker |
| 100-299 | 📜 Novice Prover |
| 0-99 | 🌱 Beginner |

---

## 🏆 Achievements

- 🔥 **5x Combo Achiever** - Reach 5x combo
- 🔥🔥 **10x Combo Master** - Reach 10x combo
- 🔥🔥🔥 **Mega Combo Legend** - Reach 15x combo
- 👑 **Legendary Combo God** - Reach 20x+ combo
- ⭐ **Level 5 Champion** - Reach level 5
- 👑 **Level 10 Master** - Reach level 10
- 💯 **500+ Score Club** - Score 500+ points
- 🎯 **1000+ Elite Player** - Score 1000+ points
- 🚀 **2000+ Legendary** - Score 2000+ points
- 📊 **Collector Pro** - Collect 50+ valid proofs

---

## 🔧 Configuration

### Update Game URL (After Deployment)

Edit `game.js` and update the share functions:

```javascript
// Line ~950
function shareOnTwitter() {
    const url = 'https://YOUR-DEPLOYED-URL.vercel.app'; // Update this
    // ...
}

// Line ~970
function copyScoreText() {
    const url = 'https://YOUR-DEPLOYED-URL.vercel.app'; // Update this
    // ...
}
```

### Adjust Difficulty

Edit `game.js` to customize:
```javascript
// Line ~200 - Starting lives
lives = 5; // Change to increase/decrease difficulty

// Line ~580 - Proof spawn rate
}, Math.max(800, 1200 - (level * 50))); // Adjust spawn timing

// Line ~610 - Valid proof probability
const isValid = Math.random() > Math.min(0.25 + (level * 0.06), 0.65);
```

---

## 🐛 Known Issues

None at the moment! If you find any bugs, please report them in the [Issues](https://github.com/yourusername/proof-collector/issues) section.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Developer

**Developed by Casp3r**

- Twitter: [@ChukwuLawrencem](https://twitter.com/ChukwuLawrencem)
- GitHub: [Your GitHub Profile]

---

## 👥 Development Team

This game was brought to life by an amazing team of developers:

| Name | GitHub | Email |
|------|--------|-------|
| **Emmy** | [@iamsoreal](https://github.com/iamsoreal) | oyemi055@gmail.com |
| **dacflamez** | [@dacflamez001](https://github.com/dacflamez001) | dacflamezconnect@gmail.com |
| **Capeboss** | [@Capeboss](https://github.com/Capeboss) | inyeneabasi416@gmail.com |
| **Edekhe** | [@Edekhe](https://github.com/Edekhe) | Edekhedaniel@gmail.com |
| **Orca** | [@Orcaakillerwhale](https://github.com/Orcaakillerwhale) | hillsons07@gmail.com |
| **Willow** | [@PrincessWanne](https://github.com/PrincessWanne) | wanneweb3@gmail.com |
| **Elly** | [@elauella](https://github.com/elauella) | emmanuellaekeng@gmail.com |
| **Whizzy** | [@Whizzyf](https://github.com/Whizzyf) | adefabisam@gmail.com |
| **Bright Kelechi** | [@Swiftguy-1](https://github.com/Swiftguy-1) | brightkelechi009@gmail.com |

**Special thanks to all team members for their dedication and hard work!** 🙌

---

## 🙏 Acknowledgments

- Inspired by classic arcade games
- Built with love for the blockchain community
- Thanks to all players and contributors!
- Shoutout to the amazing development team that made this possible

---

## 📞 Support

If you enjoy the game:
- ⭐ Star this repository
- 🐦 Share on Twitter
- 🎮 Challenge your friends
- 💬 Provide feedback

For bugs or feature requests, open an [issue](https://github.com/yourusername/proof-collector/issues).

---

## 📈 Roadmap

### Upcoming Features
- [ ] Multiplayer mode
- [ ] Leaderboard system
- [ ] More power-ups
- [ ] Sound track music
- [ ] Daily challenges
- [ ] Skin customization
- [ ] Tournament mode

---

## 🎉 Have Fun!

Enjoy playing The Proof Collector and become a Legendary Prover! 🚀

**Enjoy verifying proofs! 🎮✓**

**Play now**: [Your Game URL]

---

<div align="center">

Made with ❤️ by Casp3r

**[Play Game](https://your-game-url.vercel.app)** • **[Report Bug](https://github.com/yourusername/proof-collector/issues)** • **[Request Feature](https://github.com/yourusername/proof-collector/issues)**

</div>