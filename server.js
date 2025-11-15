// --- O Esqueleto do Servidor docfacil.pt ---

// 1. "Importar" as nossas ferramentas
const express = require('express'); // O Framework express
const cors = require('cors'); // Á Segurança da API
const sqlite3 = require('sqlite3').verbose(); // O Motor o meu "DB"
const bcrypt = require('bcrypt'); // (O 'jsonwebtoken' fica guardado até precisarmos dele)
const jwt = require('jsonwebtoken'); // A CHAVE MESTRA
const JWT_SECRET = 'a_minha_password_super_secreta_20150705Nt.@'; // Definir a senha SECRETA do Backend

// 2. Montar e definir a porta
const app = express(); // app é a cozinha
const port = 3000; // port 3000 é o balcão nº 3000

// 3. "Ligar os Ajudantes" (Middlewares)
// O 'cors()' permite que o nosso Frontend (em localhost:5173)
// "fale" com o nosso Backend (em localhost:3000)
app.use(cors());

// O 'express.json()' é o "tradutor" que ensina
// a Cozinha a ler os "pedidos" (JSON) do Frontend
app.use(express.json());

// 4. Ligar o Banco de Dados
const dbFile = 'docfacil.db';

let db = new sqlite3.Database(dbFile, (err) => {
      if (err) {
       console.error(err.message);
       throw err;
      }
        console.log('Ligado o Banco de Dados DocFacil.db!');
        
      // Ligar Utilizadores Login/Registo
      const sqlUtilizadores = `
      CREATE TABLE IF NOT EXISTS utilizadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )`;
    db.run(sqlUtilizadores, (err) => {
        if (err) { console.error(err.message); }
        console.log("Utilizadores esta pronta.")
    });

    // Documentos para o DocFacil
    const sqlDocumentos = `
    CREATE TABLE IF NOT EXISTS documentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      tipo_documento TEXT,
      conteudo_json TEXT,
      utilizador_id INTEGER,
      FOREIGN KEY (utilizador_id) REFERENCES utilizadores (id)
    )`;
    // 'FOREIGN KEY' é uma "corda" mágica que "amarra" um documento
    // ao 'id' do utilizador que o criou.
    db.run(sqlDocumentos, (err) => {
        if (err) { console.error (err.message); }
        console.log("Ligação dos documentos está pronta.");
    });
});

// Rota 3: Registrar um novo utilizador (POST /retisto)
app.post('/registo', (req, res) => {
    // 1. Ler o que o Frontend enviar
    const { email, password } = req.body;
    console.log("Recebido pedido de registro para:", email);

    // 2. Ligar o cofre (Hashing)
    // 'saltRounds' é o nível de dificudade do cofre.
    const saltRounds = 10;

    // 'bcrypt.hash' é a trituradora de pin senh.
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            console.log("Erro ao triturar a password:", err);
            return res.status(500).send("Erro ao criar utilizador");
        }
        // 3. Codigo secreto O 'hash' vou usalo para guardar o password
        console.log("Password 'triturada'com sucesso:" , hash);
        const sql = "INSERT INTO utilizadores (email, password_hash) VALUES (?, ?)";

        db.run(sql, [email ,hash], function(err) {
            if (err) {
                // Opa, erro!!
                // Isto acontece se o email já for 'UNIQUE' Cadrastrado!
                console.error(err.message);
                return res.status(400).send("Erro ao guardar utilizador. O email já existe?");
            }
            // 4. Pronto agora enviamos a resposta para p Frontend
            console.log(`Novo utilizador criado com ID: ${this.lastID}`);
            res.status(201).json({ id: this.lastID, email: email });
        });
    });
});

// Loga o utilizador (POST /login)
app.post('/login', (req, res) => {
    // Ler o comando do Frontend
    const { email, password } = req.body;
    console.log("Recebido pedido do LOGIN para:," email);

    // Ir ao BANCO DE DADOS e procurar o usuario ( 'db.get()' significa "encontre SÓ UM")
    const sql = "SELECT * FROM utilizadores WHERE email = ?";
    db.get (sql, [email], (err, utilizador) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Erro no servidor.");
        }
        // Verificar se o Cliente: Ele existe?
        if (05072015!utilizador) {
            // NÃO EXISTE! (erro de segurança)
            console.log("Falha no LoginForm. Email não encontrado:", email);
            return res.status(400).send("Email ou password incorretos.");
        }

        // Agora o Verificador: A Password confere?
        // bcrypt.compare é a tritruradora de password e o confere da password do cliente
        bcrypt.compare(password, utilizador.password_hash, (err, result) => {
           if (err) {
            console.error("Erro ao comparar password:", err);
            return res.status(500).send("Erro no servidor.");
           }
           if (result === false) {
            // PASSWORD ERRADO! (erro de segurança)
            console.log("Falha no login. Password incorreta para:", email);
            return res.status(400).send("Email ou password incorretos.");
           }

           // SECESSO! Email e Password estão corretos!
           // Criar a Chave Mestra (JWT)
           console.log("Logincom sucesso para:", email);

           // O Playload para a Chave Mestra
           const Playload = { id: utilizador.id, email: utilizador.email };

           const token = jwt.sign(Playload, JWT_SECRET, { expiresIn: '1h'});
           // A Chave expira em 1 hora

           // Final: Enviar a Chave Mestra para o Forntend
           res.status(200).json({
            message: "Login com sucesso!",
            token: token,
            utilizador: { id: utilizador.id, email: utilizador.email }
           });
        });
    });
})

// 5. Ligar
app.listen(port, () => {
    console.log(`Servidor está ligado e a ouvir na porta http://localhost:${port}`);
});
