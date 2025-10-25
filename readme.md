# 🎮 The Proof Collector

A fun, blockchain-themed arcade game where you verify cryptographic proofs while dodging fake ones! Built with vanilla JavaScript and featuring engaging gameplay mechanics inspired by zero-knowledge proofs and blockchain validation.

![Game Preview](https://img.shields.io/badge/Status-Complete-success) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow) ![License](https://img.shields.io/badge/License-MIT-blue)

## 🌟 Features

### Game Modes
- **⚡ Quick Mode** - 3 minutes of intense proof verification
- **🔥 Challenge Mode** - 5 minutes with increasing difficulty
- **♾️ Endless Mode** - Survive as long as you can!

### Gameplay Mechanics
- **Dynamic Difficulty** - Difficulty increases with each level
- **Combo System** - Chain valid proofs for bonus points and multipliers
- **Power-ups System** - 5 unique power-ups with special abilities
- **Score History** - Track your top 5 scores with persistent storage
- **Rank System** - From Beginner to Legendary Prover
- **Visual Effects** - Particles, confetti, trails, and animations
- **Sound Effects** - Web Audio API synthesized sounds
- **Responsive Design** - Mobile-friendly with touch support

### Power-ups
1. **🛡️ Shield** - Protects from one fake proof (12s duration)
2. **❄️ Freeze** - Slows down time (6s duration)
3. **⭐ 2x Points** - Double score multiplier (12s duration)
4. **💛 Extra Life** - Gain one additional life
5. **🔷 Soundness Boost** - 2x combo multiplier (15s duration)

## 📁 Project Structure

```
proof-collector/
│
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Game styles and animations
├── js/
│   └── game.js         # Complete game logic
└── README.md           # This file
```

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Basic understanding of HTML/CSS/JavaScript (for modifications)

### Installation

3. **Start playing**:
   - Choose your game mode
   - Use arrow keys or WASD to move

## 🎯 How to Play

### Controls
- **Arrow Keys** or **WASD** - Move your character (🎯)
- **P Key** - Pause/Resume game
- **Mouse** - Click buttons and interact with UI

### Objective
- Collect **✓ Valid Proofs** (green) to earn points (+10 base)
- Avoid **✗ Fake Proofs** (red) to preserve lives (-5 points, -1 life)
- Build combos by collecting 5+ valid proofs in a row
- Collect power-ups to gain advantages
- Reach higher levels and set new high scores!

### Scoring System
- **Valid Proof**: +10 points (base)
- **Fake Proof**: -5 points and -1 life
- **Combo Bonus**: +5 points per 5-combo milestone
- **Multipliers**: Stack with power-ups for massive scores
- **Level Up**: Every 8 valid proofs collected

### Ranks
- 🌱 **Beginner** - 0-99 points
- 📜 **Novice Prover** - 100-299 points
- 🥉 **Bronze Checker** - 300-599 points
- 🥈 **Silver Validator** - 600-999 points
- 🥇 **Gold Verifier** - 1000-1499 points
- 💎 **Diamond Auditor** - 1500-1999 points
- 👑 **Legendary Prover** - 2000+ points

## 🔧 Technical Details

### Technologies Used
- **Vanilla JavaScript** (ES6+)
- **HTML5** Canvas & DOM manipulation
- **CSS3** Animations and transitions
- **Web Audio API** for sound effects
- **Claude Storage API** for persistent data

### Key Features Implementation

#### Storage System
Uses Claude's persistent storage API to save:
- High scores across sessions
- Top 5 game history with timestamps
- Rank achievements

```javascript
// Save high score
await window.storage.set('proof-collector-highscore', score.toString());

// Load score history
const hist = await window.storage.get('proof-collector-history');
```

#### Collision Detection
Implements circular collision detection:
```javascript
const distance = Math.sqrt(dx * dx + dy * dy);
if (distance < (playerSize/2 + proofSize/2)) {
    // Collision detected
}
```

#### Difficulty Scaling
- Fake proof probability increases with level
- Spawn rate increases after level 2
- Multiple proofs spawn simultaneously at higher levels

#### Visual Effects
- Particle systems for collections
- Confetti celebration for achievements
- Player movement trails
- Screen shake on hits
- Fade-out animations for despawning items

## 🎨 Customization

### Modify Game Balance
Edit values in `js/game.js`:
```javascript
// Starting values
let lives = 5;           // Starting lives
const moveSpeed = 5;     // Player movement speed

// Scoring
const basePoints = 10;   // Points per valid proof

// Durations (milliseconds)
const durations = {
    shield: 12000,       // Shield duration
    freeze: 6000,        // Freeze duration
    multiplier: 12000,   // 2x points duration
    'combo-boost': 15000 // Soundness boost duration
};
```

### Change Colors & Styles
Modify `css/style.css` for:
- Color schemes
- Animation speeds
- UI element sizes
- Responsive breakpoints

## 📱 Mobile Support

The game includes:
- **Hamburger menu** for mobile devices
- **Touch-optimized** controls
- **Responsive layout** that adapts to screen size
- **Mobile-first** design considerations

## 🐛 Known Issues & Limitations

- Power-ups can overlap when multiple spawn
- Very high combo counts may cause slight performance drops
- Audio may require user interaction to start (browser policy)

## 🔮 Future Enhancements

Potential features to add:
- [ ] Touch controls for mobile (swipe/joystick)
- [ ] Leaderboard with player names
- [ ] Achievement system with badges
- [ ] Multiple character skins
- [ ] Different proof types with unique effects
- [ ] Boss levels or special events
- [ ] Multiplayer mode
- [ ] Sound on/off persistence

## 👨‍💻 Developer

**Developed by Casp3r**

Connect with me:
- 🐦 Twitter: [@ChukwuLawrencem](https://x.com/ChukwuLawrencem)

## 📄 License

This project is licensed under the MIT License - feel free to use, modify, and distribute as you wish.

## 🙏 Acknowledgments

- Inspired by blockchain verification concepts
- Built with Claude AI assistance
- Special thanks to the zero-knowledge proof community

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Reach out on Twitter
- Check the code comments for implementation details

---

## 📞 TEAMS:

Here are my Teams behind the game:
Name                           Github Username                          Email:
Emmy                           iamsoreal                     oyemi055@gmail.com                  
dacflamez                      dacflamez001                  dacflamezconnect@gmail.com
Capeboss                       Capeboss                      inyeneabasi416@gmail.com
Edekhe                         Edekhe                        Edekhedaniel@gmail.com
Orca                           Orcaakillerwhale              hillsons07@gmail.com
Willow                         PrincessWanne                 wanneweb3@gmail.com
Elly                           elauella                      emmanuellaekeng@gmail.com
Whizzy                         Whizzyf                       adefabisam@gmail.com
Bright Kelechi                 Swiftguy-1                    brightkelechi009@gmail.com

---
**Enjoy verifying proofs! 🎮✓**