# API Rede Social

## Visão Geral

Esta API foi desenvolvida para dar suporte a uma plataforma de rede social, permitindo aos usuários criar perfis, publicar conteúdo, interagir através de curtidas e comentários.

## Tecnologias Utilizadas

- **Node.js** - Ambiente de execução JavaScript
- **Express** - Framework para construção da API
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM (Object Data Modeling) para MongoDB
- **JWT** - Autenticação baseada em tokens
- **bcryptjs** - Criptografia de senhas

## Estrutura do Projeto

```
api-rede-social/
├── index.js                # Ponto de entrada da aplicação
├── package.json            # Dependências e scripts
├── vercel.json             # Configuração para deploy na Vercel
├── src/
│   ├── config/             # Configurações da aplicação
│   │   ├── database.js     # Conexão com o banco de dados
│   │   └── logger.js       # Configuração de logs
│   ├── controllers/        # Controladores da aplicação
│   │   ├── authController.js    # Autenticação
│   │   ├── postController.js    # Gerenciamento de posts
│   │   └── commentController.js # Gerenciamento de comentários
│   ├── middleware/         # Middlewares
│   │   ├── authMiddleware.js    # Proteção de rotas
│   │   └── errorHandler.js      # Tratamento de erros
│   ├── models/             # Modelos de dados
│   │   ├── userModel.js    # Modelo de usuário
│   │   ├── postModel.js    # Modelo de postagem
│   │   └── commentModel.js # Modelo de comentário
│   └── routes/             # Rotas da API
│       ├── authRoutes.js   # Rotas de autenticação
│       ├── postRoutes.js   # Rotas de posts
│       └── commentRoutes.js# Rotas de comentários
```

## Funcionalidades

### Autenticação

- Cadastro de usuários
- Login (recebe token JWT)
- Proteção de rotas privadas

### Usuários

- Perfil com nome, email, nickname e foto
- Senha criptografada
- Imagem de perfil gerada automaticamente usando DiceBear API

### Postagens

- Criação de posts com texto e mídia opcional
- Curtidas em posts
- Contagem de curtidas
- Atualização e exclusão de posts próprios

### Comentários

- Sistema hierárquico (comentários e respostas)
- Curtidas em comentários
- Respostas aninhadas (comentários em comentários)
- Contagem de curtidas em comentários

## Endpoints da API

### Autenticação

```
POST /api/auth/register - Registrar novo usuário
POST /api/auth/login    - Login e obtenção de token
```

### Posts

```
GET    /api/posts          - Listar todas as postagens
POST   /api/posts          - Criar nova postagem
GET    /api/posts/:id      - Obter uma postagem específica
PUT    /api/posts/:id      - Atualizar uma postagem
DELETE /api/posts/:id      - Excluir uma postagem
POST   /api/posts/:id/like - Curtir/descurtir uma postagem
GET    /api/posts/user/:userId - Listar posts de um usuário específico
```

### Comentários

```
GET    /api/posts/:postId/comments           - Listar comentários de um post
POST   /api/posts/:postId/comments           - Criar comentário em um post
PUT    /api/posts/:postId/comments/:commentId - Atualizar comentário
DELETE /api/posts/:postId/comments/:commentId - Excluir comentário
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
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```
PORT=3000
MONGO_URI=sua_url_do_mongodb
JWT_SECRET=seu_secret_para_jwt
CORS_ORIGIN=http://localhost:5173  # URL do frontend
```

4. Execute o servidor:
```bash
npm start
# ou para ambiente de desenvolvimento
npm run dev
```

## Modelos de Dados

### Usuário
- `name`: Nome completo
- `email`: Email único
- `password`: Senha (armazenada com hash)
- `nickname`: Nome de usuário único
- `profilePicture`: URL da foto de perfil

### Post
- `user`: Referência ao usuário que criou
- `content`: Conteúdo do post
- `media_url`: URL opcional para mídia (imagem/vídeo)
- `likes`: Lista de usuários que curtiram
- `likes_count`: Contagem de curtidas
- `comments_count`: Contagem de comentários

### Comentário
- `post`: Referência ao post
- `user`: Referência ao usuário que comentou
- `content`: Conteúdo do comentário
- `parent`: Referência ao comentário pai (se for uma resposta)
- `likes`: Lista de usuários que curtiram
- `likes_count`: Contagem de curtidas
- `level`: Nível de profundidade do comentário

## Exemplos de Uso

### Registrar um novo usuário
```json
POST /api/auth/register
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123",
  "nickname": "joaosilva"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

### Criar uma postagem
```json
POST /api/posts
Headers: Authorization: Bearer [token]
{
  "content": "Minha primeira postagem!",
  "media_url": "https://exemplo.com/imagem.jpg"
}
```

### Criar um comentário
```json
POST /api/posts/123/comments
Headers: Authorization: Bearer [token]
{
  "content": "Ótima postagem!"
}
```

### Responder a um comentário
```json
POST /api/posts/123/comments
Headers: Authorization: Bearer [token]
{
  "content": "Concordo com você!",
  "parentId": "456"
}
```

## Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das alterações (`git commit -m 'Adiciona nova feature'`)
4. Envie para o branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request
