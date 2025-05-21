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

// Note (vuoto esempio)
app.get('/note', authenticateToken, (req, res) => {
  const mieNote = note.filter(n => n.prof === req.user.username);
  res.json(mieNote);
});

// Assenze (vuoto esempio)
app.get('/assenze', authenticateToken, (req, res) => {
  const mieAssenze = assenze.filter(a => a.prof === req.user.username);
  res.json(mieAssenze);
});

app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
// Stato presenze (per esempio fittizio: tutti presenti tranne qualcuno)
const presenze = studenti.map(nome => {
    // per esempio casualmente mettiamo qualcuno assente
    return {
        nome,
        presente: Math.random() > 0.2  // 80% probabilità presente
    };
});

// Popola lista studenti con presenza
function popolaStudentiPresenza() {
    const ul = document.getElementById("studenti-presenza");
    ul.innerHTML = "";

    presenze.forEach(studente => {
        const li = document.createElement("li");
        li.textContent = studente.nome;

        const spanPresenza = document.createElement("span");
        spanPresenza.style.fontWeight = "600";
        spanPresenza.style.color = studente.presente ? "#4ade80" : "#ef4444"; // verde o rosso
        spanPresenza.textContent = studente.presente ? "Presente" : "Assente";

        li.appendChild(spanPresenza);
        ul.appendChild(li);
    });
}

// Al caricamento voto popola select anche da presenze
function popolaStudenti() {
    const select = document.getElementById("studente");
    select.innerHTML = "";

    presenze.forEach(studente => {
        if (studente.presente) {
            const option = document.createElement("option");
            option.value = studente.nome;
            option.textContent = studente.nome;
            select.appendChild(option);
        }
    });
}

// Chiamala dentro login, quando apri la sezione registro
// (al posto della vecchia popolaStudenti)
function initRegistroSection() {
    popolaStudentiPresenza();
    popolaStudenti();

    // Nota: potresti voler caricare note da backend qui

    // Nascondi form voto all'inizio
    document.getElementById("voto-form").style.display = "none";
}

// Toggle mostra/nascondi form voto
document.getElementById("toggle-voto-form").addEventListener("click", () => {
    const form = document.getElementById("voto-form");
    if (form.style.display === "none") {
        form.style.display = "block";
    } else {
        form.style.display = "none";
    }
});

// Salvataggio note generali (qui solo localStorage per esempio)
document.getElementById("salva-note-btn").addEventListener("click", () => {
    const note = document.getElementById("note-generali").value.trim();
    localStorage.setItem("noteGeneraliRegistro", note);
    alert("Note salvate!");
});

// Carica note generali da storage all'avvio
function caricaNoteGenerali() {
    const note = localStorage.getItem("noteGeneraliRegistro") || "";
    document.getElementById("note-generali").value = note;
}

// Aggiorna la parte di login, quando mostra la sezione registro
document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    nascondiErrore("login-error");

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    if (!username || !password) {
        mostraErrore("login-error", "Inserisci username e password.");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (res.ok) {
            token = data.token;
            nomeProf = username;
            document.getElementById("nome-prof").textContent = nomeProf;

            // Nascondi form login e registrazione
            document.getElementById("login-form").style.display = "none";
            document.getElementById("register-form").style.display = "none";

            // Mostra sezione registro
            document.getElementById("registro-section").style.display = "block";

            // Inizializza registro: lista studenti, presenze, note ecc.
            initRegistroSection();
            caricaNoteGenerali();

            caricaVoti();
        } else {
            mostraErrore("login-error", data.msg || "Errore nel login.");
        }
    } catch (err) {
        mostraErrore("login-error", "Errore di connessione al server.");
    }
});
