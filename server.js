const express = require('express');
const path = require('path');
const app = express();
const PORT = 3002;

// Middleware
app.use(express.static(__dirname));
app.use(express.json());

// Game data
const planets = [
  {
    id: 1,
    name: "Terra Nova",
    environment: "Earth-like",
    resources: ["Iron", "Water", "Titanium"]
  },
  {
    id: 2,
    name: "Frost Prime",
    environment: "Ice Planet",
    resources: ["Ice", "Methane", "Rare Crystals"]
  },
  {
    id: 3,
    name: "Vulcan",
    environment: "Volcanic",
    resources: ["Sulfur", "Obsidian", "Platinum"]
  },
  {
    id: 4,
    name: "Zephyr",
    environment: "Gas Giant",
    resources: ["Hydrogen", "Helium", "Exotic Gases"]
  },
  {
    id: 5,
    name: "Nexus Station",
    environment: "Space Station",
    resources: ["Technology", "Alloys", "Medical Supplies"]
  }
];

const ships = [
  {
    id: 1,
    name: "Explorer",
    type: "Scout",
    speed: 8,
    armor: 3,
    weapons: 2
  },
  {
    id: 2,
    name: "Destroyer",
    type: "Combat",
    speed: 5,
    armor: 7,
    weapons: 8
  },
  {
    id: 3,
    name: "Hauler",
    type: "Cargo",
    speed: 4,
    armor: 6,
    weapons: 3
  }
];

const outposts = [];
const players = [];

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Game status endpoint
app.get('/api/game/status', (req, res) => {
  res.json({ status: 'online', version: '1.0.0' });
});

// Get all planets
app.get('/api/planets', (req, res) => {
  res.json(planets);
});

// Get all ships
app.get('/api/ships', (req, res) => {
  res.json(ships);
});

// Get player by ID
app.get('/api/players/:id', (req, res) => {
  const player = players.find(p => p.id === parseInt(req.params.id));
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  res.json(player);
});

// Create a new player
app.post('/api/players', (req, res) => {
  const { name, background, appearance } = req.body;
  
  // Validate input
  if (!name || !background || !appearance) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Create new player
  const newPlayer = {
    id: players.length + 1,
    name,
    background,
    appearance,
    level: 1,
    experience: 0,
    inventory: [],
    outposts: [],
    ship: ships[0], // Default to Explorer ship
    location: planets[0], // Default to Terra Nova
    health: 100,
    credits: 1000
  };
  
  players.push(newPlayer);
  res.status(201).json(newPlayer);
});

// Update player location
app.put('/api/players/:id/location', (req, res) => {
  const { planetId } = req.body;
  const player = players.find(p => p.id === parseInt(req.params.id));
  
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  const planet = planets.find(p => p.id === planetId);
  if (!planet) {
    return res.status(404).json({ error: 'Planet not found' });
  }
  
  player.location = planet;
  res.json(player);
});

// Combat simulation
app.post('/api/combat/simulate', (req, res) => {
  const { playerId, enemyType } = req.body;
  
  // Find player
  const player = players.find(p => p.id === parseInt(playerId));
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  // Simulate combat
  const playerPower = player.ship.weapons + player.ship.armor;
  let enemyPower = 0;
  
  switch (enemyType) {
    case 'pirate':
      enemyPower = 5 + Math.floor(Math.random() * 5);
      break;
    case 'military':
      enemyPower = 10 + Math.floor(Math.random() * 8);
      break;
    case 'alien':
      enemyPower = 15 + Math.floor(Math.random() * 10);
      break;
    default:
      enemyPower = 5;
  }
  
  const victory = playerPower >= enemyPower;
  const playerDamage = Math.floor(Math.random() * 30) + 10;
  const experienceGained = victory ? Math.floor(Math.random() * 20) + 10 : 5;
  
  // Update player
  player.experience += experienceGained;
  player.health = Math.max(0, player.health - playerDamage);
  
  // Check for level up
  if (player.experience >= player.level * 100) {
    player.level += 1;
  }
  
  res.json({
    victory,
    playerDamage,
    experienceGained,
    levelUp: player.experience >= player.level * 100,
    currentHealth: player.health,
    currentLevel: player.level,
    currentExperience: player.experience
  });
});

// Get all outposts
app.get('/api/outposts', (req, res) => {
  res.json(outposts);
});

// Create outpost
app.post('/api/outposts', (req, res) => {
  const { playerId, planetId, name, type } = req.body;
  
  // Find player
  const player = players.find(p => p.id === parseInt(playerId));
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  // Validate planet
  const planet = planets.find(p => p.id === planetId);
  if (!planet) {
    return res.status(404).json({ error: 'Planet not found' });
  }
  
  // Create outpost
  const newOutpost = {
    id: outposts.length + 1,
    name,
    type,
    level: 1,
    planetId,
    playerId,
    resources: [],
    production: 0
  };
  
  outposts.push(newOutpost);
  player.outposts.push(newOutpost.id);
  
  res.status(201).json(newOutpost);
});

// Contact form submission
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  
  // Validate input
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // In a real application, you would store this data or send an email
  console.log('Contact form submission:', { name, email, subject, message });
  
  // Return success response
  res.status(200).json({ success: true, message: 'Thank you for your message! We will get back to you soon.' });
});

// Game information endpoint
app.get('/api/game/about', (req, res) => {
  res.json({
    name: "Starfield",
    version: "1.0.0",
    description: "A space-themed adventure game where players explore planets, engage in combat, and build outposts.",
    story: "In the year 2330, humanity has spread across the stars, establishing colonies and outposts throughout the galaxy. As interstellar travel became commonplace, new factions emerged, each with their own vision for humanity's future among the stars.",
    developer: "Starfield Game Studios",
    releaseDate: "2023",
    platforms: ["Web", "PC", "Mac"],
    genre: ["Space Exploration", "Adventure", "Simulation"]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to play the game`);
});
