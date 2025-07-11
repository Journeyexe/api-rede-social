# API Rede Social

## Visão Geral

Esta API foi desenvolvida para dar suporte a uma plataforma de rede social completa, permitindo aos usuários criar perfis, publicar conteúdo, interagir através de curtidas, comentários, salvar posts favoritos e muito mais. A API oferece um sistema robusto de autenticação, gerenciamento de posts com mídia, sistema hierárquico de comentários e funcionalidades sociais avançadas.

## Tecnologias Utilizadas

- **Node.js** - Ambiente de execução JavaScript
- **Express** - Framework web para construção da API REST
- **MongoDB** - Banco de dados NoSQL para persistência
- **Mongoose** - ODM (Object Data Modeling) para MongoDB
- **JWT** - Autenticação baseada em tokens seguros
- **bcryptjs** - Criptografia de senhas com salt
- **Winston** - Sistema de logging avançado
- **Cookie Parser** - Gerenciamento de cookies HTTP
- **CORS** - Controle de acesso entre domínios
- **Mongoose Sanitize** - Sanitização de dados de entrada
- **Mongoose Timestamp** - Timestamps automáticos

## Estrutura do Projeto

```
api-rede-social/
├── src/app.js              # Ponto de entrada da aplicação
├── package.json            # Dependências e scripts
├── vercel.json             # Configuração para deploy na Vercel
├── .gitignore             # Arquivos ignorados pelo Git
├── .env.example           # Exemplo de configuração de ambiente
├── src/
│   ├── config/             # Configurações da aplicação
│   │   ├── database.js     # Conexão com MongoDB
│   │   └── logger.js       # Configuração de logs com Winston
│   ├── controllers/        # Controladores da aplicação
│   │   ├── authController.js    # Autenticação e autorização
│   │   ├── postController.js    # CRUD de posts e interações
│   │   └── commentController.js # Sistema de comentários hierárquico
│   ├── middleware/         # Middlewares customizados
│   │   ├── authMiddleware.js    # Proteção JWT e autorização
│   │   └── errorHandler.js      # Tratamento global de erros
│   ├── models/             # Modelos de dados Mongoose
│   │   ├── userModel.js    # Schema de usuários
│   │   ├── postModel.js    # Schema de postagens
│   │   └── commentModel.js # Schema de comentários
│   └── routes/             # Definição de rotas
│       ├── authRoutes.js   # Rotas de autenticação
│       ├── postRoutes.js   # Rotas de posts
│       └── commentRoutes.js# Rotas de comentários
├── combined.log           # Log combinado da aplicação
└── error.log             # Log específico de erros
```

## Funcionalidades

### 🔐 Sistema de Autenticação
- Cadastro de usuários com validação
- Login seguro com JWT tokens
- Logout com limpeza de cookies
- Middleware de proteção de rotas
- Verificação de perfil do usuário logado
- Autorização baseada em papéis (roles)

### 👤 Gerenciamento de Usuários
- Perfil completo com nome, email, nickname único
- Edição de perfil (nome, nickname e foto de perfil)
- Senha criptografada com bcrypt e salt
- Foto de perfil automática via DiceBear API
- Histórico de posts curtidos (`likedPosts`)
- Lista de posts salvos (`savedPosts`)
- Validações robustas de dados

### 📝 Sistema de Postagens
- Criação de posts com título, conteúdo e mídia opcional
- Sistema de curtidas com contadores automáticos
- Sistema de salvamento de posts favoritos
- Contadores duplos (likes e saves) com sincronização
- Paginação para listagem de posts
- CRUD completo com autorização
- Busca por posts de usuários específicos
- Listagem de posts curtidos e salvos pelo usuário

### 💬 Sistema de Comentários Hierárquico
- Comentários em posts com respostas aninhadas
- Sistema multinível com controle de profundidade
- Curtidas em comentários independentes
- Contadores automáticos de curtidas
- Exclusão em cascata (comentário pai remove filhos)
- Paginação para comentários e respostas
- Populamento automático de dados do usuário

## Endpoints da API

### 🔐 Autenticação
```
POST /api/auth/register      - Registrar novo usuário
POST /api/auth/login         - Login e obtenção de token JWT
POST /api/auth/logout        - Logout e limpeza de cookies
GET  /api/auth/me            - Obter dados do usuário logado
PUT  /api/auth/update-profile - Atualizar perfil do usuário (nome, nickname, foto)
```

### 📝 Posts
```
GET    /api/posts              - Listar todos os posts (paginado)
POST   /api/posts              - Criar nova postagem
GET    /api/posts/:id          - Obter uma postagem específica
PUT    /api/posts/:id          - Atualizar uma postagem (autor apenas)
DELETE /api/posts/:id          - Excluir uma postagem (autor apenas)
POST   /api/posts/:id/like     - Curtir/descurtir uma postagem
POST   /api/posts/:id/save     - Salvar/dessalvar uma postagem
GET    /api/posts/saved        - Listar posts salvos do usuário
GET    /api/posts/liked        - Listar posts curtidos do usuário
GET    /api/posts/user/:userId - Listar posts de um usuário específico
```

### 💬 Comentários
```
GET    /api/posts/:postId/comments                    - Listar comentários de um post (hierárquico)
GET    /api/posts/:postId/comments/all                - Listar todos os comentários (estrutura plana)
POST   /api/posts/:postId/comments                    - Criar comentário em um post
PUT    /api/posts/:postId/comments/:commentId         - Atualizar comentário (autor apenas)
DELETE /api/posts/:postId/comments/:commentId         - Excluir comentário (autor apenas)
GET    /api/posts/:postId/comments/:commentId/replies - Listar respostas a um comentário
POST   /api/posts/:postId/comments/:commentId/like    - Curtir/descurtir comentário
```

## Como Instalar e Executar

1. Clone o repositório:
```bash
git clone https://github.com/Journeyexe/api-rede-social
cd api-rede-social
```

2. Instale as dependências:
```bash
npm install

# Para desenvolvimento, instale também as dependências dev
npm install --include=dev
```

3. Configure as variáveis de ambiente:
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações
nano .env
```

Configurações obrigatórias no `.env`:
```env
PORT=3000
MONGO_URI=sua_url_do_mongodb
JWT_SECRET=sua_chave_secreta_muito_forte
CORS_ORIGIN=http://localhost:3000  # URL do frontend
```

4. Execute o servidor:
```bash
# Produção
npm start

# Desenvolvimento (com auto-reload)
npm run dev

# Ou diretamente com Node.js
node src/app.js
```

## 🚀 Deploy

A aplicação está configurada para deploy na **Vercel** através do arquivo `vercel.json`. O deploy é automático quando conectado ao repositório GitHub.

### Variáveis de ambiente para produção:
- `PORT`: Porta do servidor (definida automaticamente pela Vercel)
- `MONGO_URI`: String de conexão do MongoDB Atlas
- `JWT_SECRET`: Chave secreta para assinatura JWT (use uma chave forte)
- `JWT_EXPIRES_IN`: Tempo de expiração do token (padrão: 30d)
- `NODE_ENV`: Ambiente de execução (production)
- `CORS_ORIGIN`: URL do frontend em produção

## 📊 Modelos de Dados

### 👤 Usuário (User)
```javascript
{
  name: String,           // Nome completo (obrigatório)
  email: String,          // Email único (obrigatório, validado)
  password: String,       // Senha hash com bcrypt (min: 6 chars)
  nickname: String,       // Nome de usuário único (min: 3 chars)
  profilePicture: String, // URL da foto (auto-gerada via DiceBear)
  likedPosts: [ObjectId], // Array de posts curtidos pelo usuário
  savedPosts: [ObjectId], // Array de posts salvos pelo usuário
  createdAt: Date,        // Data de criação (automático)
  updatedAt: Date         // Data de atualização (automático)
}
```

### 📝 Post
```javascript
{
  user: ObjectId,         // Referência ao usuário criador (obrigatório)
  title: String,          // Título do post (max: 100 chars)
  content: String,        // Conteúdo do post (obrigatório)
  media_url: String,      // URL opcional para mídia
  likes: [ObjectId],      // Array de usuários que curtiram
  likes_count: Number,    // Contador automático de curtidas
  saved: [ObjectId],      // Array de usuários que salvaram
  saved_count: Number,    // Contador automático de saves
  comments_count: Number, // Contador de comentários top-level
  createdAt: Date,        // Data de criação (automático)
  updatedAt: Date         // Data de atualização (automático)
}
```

### 💬 Comentário (Comment)
```javascript
{
  post: ObjectId,         // Referência ao post (obrigatório)
  user: ObjectId,         // Referência ao usuário (obrigatório)
  content: String,        // Conteúdo do comentário (obrigatório)
  parent: ObjectId,       // Comentário pai (null se top-level)
  likes: [ObjectId],      // Array de usuários que curtiram
  likes_count: Number,    // Contador automático de curtidas
  level: Number,          // Nível de profundidade (0 = top-level)
  createdAt: Date,        // Data de criação (automático)
  updatedAt: Date         // Data de atualização (automático)
}
```

## 📋 Exemplos de Uso

### Registrar um novo usuário
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123",
  "nickname": "joaosilva"
}

# Resposta:
{
  "success": true,
  "data": {
    "id": "...",
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "token": "jwt_token_aqui"
  }
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

### Atualizar perfil do usuário
```bash
PUT /api/auth/update-profile
Authorization: Bearer [token]
Content-Type: application/json

{
  "name": "João Silva Santos",
  "nickname": "joao_santos",
  "profilePicture": "https://exemplo.com/minha-foto.jpg"
}

# Resposta:
{
  "success": true,
  "message": "Perfil atualizado com sucesso",
  "data": {
    "_id": "...",
    "name": "João Silva Santos",
    "email": "joao@exemplo.com",
    "nickname": "joao_santos",
    "profilePicture": "https://exemplo.com/minha-foto.jpg",
    "likedPosts": [],
    "savedPosts": [],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### Criar uma postagem
```bash
POST /api/posts
Authorization: Bearer [token]
Content-Type: application/json

{
  "title": "Meu primeiro post",
  "content": "Esta é minha primeira postagem na rede social!",
  "media_url": "https://exemplo.com/imagem.jpg"
}
```

### Curtir um post
```bash
POST /api/posts/123/like
Authorization: Bearer [token]

# Resposta:
{
  "success": true,
  "liked": true,
  "likesCount": 15
}
```

### Salvar um post
```bash
POST /api/posts/123/save
Authorization: Bearer [token]

# Resposta:
{
  "success": true,
  "saved": true,
  "savedCount": 8,
  "message": "Post saved successfully"
}
```

### Criar um comentário
```bash
POST /api/posts/123/comments
Authorization: Bearer [token]
Content-Type: application/json

{
  "content": "Ótima postagem! Muito interessante."
}
```

### Listar comentários de um post (estrutura hierárquica)
```bash
GET /api/posts/123/comments?page=1&limit=20
Authorization: Bearer [token]

# Resposta com comentários organizados hierarquicamente:
{
  "success": true,
  "count": 10,
  "total": 15,
  "pages": 1,
  "data": [
    {
      "_id": "comment1",
      "content": "Comentário principal",
      "user": {
        "name": "João",
        "nickname": "joao123"
      },
      "level": 0,
      "replies": [
        {
          "_id": "reply1",
          "content": "Resposta ao comentário",
          "user": {
            "name": "Maria",
            "nickname": "maria456"
          },
          "level": 1,
          "replies": []
        }
      ]
    }
  ]
}
```

### Listar todos os comentários (estrutura plana)
```bash
GET /api/posts/123/comments/all?page=1&limit=50
Authorization: Bearer [token]

# Resposta com todos os comentários em ordem cronológica:
{
  "success": true,
  "count": 25,
  "total": 25,
  "pages": 1,
  "data": [
    {
      "_id": "comment1",
      "content": "Primeiro comentário",
      "level": 0,
      "parent": null
    },
    {
      "_id": "reply1",
      "content": "Resposta ao primeiro",
      "level": 1,
      "parent": "comment1"
    }
  ]
}
```

### Responder a um comentário
```bash
POST /api/posts/123/comments
Authorization: Bearer [token]
Content-Type: application/json

{
  "content": "Concordo completamente!",
  "parentId": "456"
}
```

## Contribuição

Para contribuir com o projeto:

1. **Fork** o repositório
2. Crie uma **branch** para sua feature (`git checkout -b feature/nova-feature`)
3. **Commit** suas alterações (`git commit -m 'feat: adiciona nova feature'`)
4. **Push** para a branch (`git push origin feature/nova-feature`)
5. Abra um **Pull Request**

### Padrões de Commit
```
feat: nova funcionalidade
fix: correção de bug
docs: alterações na documentação
style: formatação, ponto e vírgula, etc
refactor: refatoração de código
test: adição de testes
chore: mudanças em ferramentas, configurações, etc
```

## 📞 Contato e Suporte

- **GitHub**: [Journeyexe](https://github.com/Journeyexe)
- **Issues**: [Reportar problemas](https://github.com/Journeyexe/api-rede-social/issues)
- **Discussions**: [Discussões](https://github.com/Journeyexe/api-rede-social/discussions)

## 🏆 Agradecimentos

- **MongoDB** pela excelente documentação do Mongoose
- **Express.js** pela simplicidade e robustez
- **DiceBear** pela API gratuita de avatares
- **Vercel** pela plataforma de deploy gratuita
- **Comunidade Node.js** pelo ecossistema incrível

---

<div align="center">

**⭐ Se este projeto foi útil, considere dar uma estrela!**

**📚 [Documentação Completa](README.md) | 🚀 [Deploy na Vercel](https://vercel.com) | 💻 [Código Fonte](https://github.com/Journeyexe/api-rede-social)**

</div>
