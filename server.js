// --- O nosso Servidor Backend com (DB) ---
// --- (AULAS 14-17) ---

// 1. "Importar" as ferramentas
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

// 2. "Montar" a Cozinha e definir a Porta
const app = express();
const port = 3000;

// 3. "Ligar" o tradutor de JSON (Aula 17)
// Isto tem de vir ANTES das rotas.
app.use(cors());
app.use(express.json());

// --- A "DESPENSA" (Banco de Dados SQLite) ---

// 4. Definir onde guardar a "Despensa"
const dbFile = 'minha_despensa.db';

// 5. "Ligar" à Despensa (Conectar ao Banco de Dados)
let db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    }
    
    console.log('Conectado com sucesso à Despensa (Banco de Dados)!');

    // 6. "Criar as Prateleiras" (Criar a Tabela)
    const sqlCriarTabela = `
        CREATE TABLE IF NOT EXISTS tarefa (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            texto_da_tarefa TEXT NOT NULL,
            esta_completa BOOLEAN DEFAULT 0
        )
    `;
    
    db.run(sqlCriarTabela, (err) => {
        if (err) {
            console.error(err.message);
            throw err;
        }
        console.log("Prateleira 'tarefa' está pronta (criada ou já existia).");
    });
});

// --- ROTAS DA API ---

// ROTA 1: BUSCAR todas as tarefas (GET)

app.get('/tarefas', (req, res) => {
    const sql = "SELECT * FROM tarefa";

    db.all(sql, (err, linhas) => {
        if (err) {
            console.error(err.message);
            res.status(500).send("Erro ao buscar dados da despensa.");
            return;
        }
        // Se funcionar, envia a lista (mesmo que vazia: [])
        res.json(linhas);
    });
});

// ROTA 2: ADICIONAR uma nova tarefa (POST)
app.post('/tarefas', (req, res) => {
    const { texto_da_tarefa } = req.body;
    
    if (!texto_da_tarefa) {
         // Verificação de segurança
         return res.status(400).send("O texto_da_tarefa não pode ser vazio.");
    }

    const sql = "INSERT INTO tarefa (texto_da_tarefa) VALUES (?)";

    db.run(sql, [texto_da_tarefa], function(err) {
        if (err) {
            console.error(err.message);
            res.status(500).send("Erro ao guardar dados na despensa.");
            return;
        }
        res.status(201).json({ id: this.lastID, texto_da_tarefa: texto_da_tarefa, esta_completa: 0 });
    });
});

app.listen(port, () => {
    console.log(`Servidor está ligado e a ouvir na porta http://localhost:${port}`);
});