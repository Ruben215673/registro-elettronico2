// server.js
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3000;
const JWT_SECRET = 'unsegretomoltoforte';

app.use(cors());
app.use(express.json());

// Dati in memoria
const utenti = [];  // { username, passwordHash }
const voti = [];    // { id, prof, studente, materia, voto, nota }
const assenze = [];
const note = [];
const orari = [
  { giorno: 'Lunedì', lezioni: ['Matematica', 'Italiano', 'Scienze'] },
  { giorno: 'Martedì', lezioni: ['Inglese', 'Storia', 'Geografia'] },
  { giorno: 'Mercoledì', lezioni: ['Arte', 'Musica', 'Ed. Fisica'] },
  { giorno: 'Giovedì', lezioni: ['Matematica', 'Informatica', 'Religione'] },
  { giorno: 'Venerdì', lezioni: ['Italiano', 'Scienze', 'Storia'] },
];

const studenti = ['Mario Rossi', 'Anna Bianchi', 'Luca Verdi'];

function generaId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Token mancante' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ msg: 'Token non valido' });
    req.user = user;
    next();
  });
}

// --- REGISTER ---
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ msg: 'Username e password obbligatori' });

  if (utenti.find(u => u.username === username))
    return res.status(400).json({ msg: 'Utente già esistente' });

  const passwordHash = await bcrypt.hash(password, 10);
  utenti.push({ username, passwordHash });
  res.json({ msg: 'Utente registrato' });
});

// --- LOGIN ---
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const utente = utenti.find(u => u.username === username);
  if (!utente) return res.status(400).json({ msg: 'Utente non trovato' });

  const valido = await bcrypt.compare(password, utente.passwordHash);
  if (!valido) return res.status(400).json({ msg: 'Password errata' });

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// --- API protette ---

// Aggiungi voto
app.post('/aggiungi', authenticateToken, (req, res) => {
  const { studente, materia, voto, nota } = req.body;
  if (!studente || !materia || typeof voto !== 'number')
    return res.status(400).json({ msg: 'Dati incompleti' });

  const id = generaId();
  voti.push({ id, prof: req.user.username, studente, materia, voto, nota });
  res.json({ msg: 'Voto aggiunto', id });
});

// Lista voti per professore loggato
app.get('/voti', authenticateToken, (req, res) => {
  const mieiVoti = voti.filter(v => v.prof === req.user.username);
  res.json(mieiVoti);
});

// Rimuovi voto per id (solo se proprietario)
app.delete('/rimuovi/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  const index = voti.findIndex(v => v.id === id && v.prof === req.user.username);
  if (index === -1) return res.status(404).json({ msg: 'Voto non trovato' });
  voti.splice(index, 1);
  res.json({ msg: 'Voto eliminato' });
});

// Orario
app.get('/orario', authenticateToken, (req, res) => {
  res.json(orari);
});

// Note
app.get('/note', authenticateToken, (req, res) => {
  const mieNote = note.filter(n => n.prof === req.user.username);
  res.json(mieNote);
});

// Assenze
app.get('/assenze', authenticateToken, (req, res) => {
  const mieAssenze = assenze.filter(a => a.prof === req.user.username);
  res.json(mieAssenze);
});

// Presenze simulate
app.get('/presenze', authenticateToken, (req, res) => {
  const presenze = studenti.map(nome => ({
    nome,
    presente: Math.random() > 0.2
  }));
  res.json(presenze);
});

app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
