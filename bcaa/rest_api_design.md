# REST API Design

## O que é REST

REST não é um protocolo — é um conjunto de princípios arquiteturais. Uma API que segue esses princípios é chamada de **RESTful**.

---

## 1. Princípios REST

**Stateless — o mais importante:**

Cada request contém toda a informação necessária para ser processada. O servidor não guarda contexto entre requests.

```
// ERRADO — servidor guarda estado da sessão
POST /login → servidor cria sessão
GET /orders → servidor usa sessão para saber quem é o usuário

// CORRETO — cliente envia token em toda request
GET /orders
Authorization: Bearer eyJhbGc... → servidor valida o token, não precisa de sessão
```

É por isso que JWT ganhou sobre sessões em APIs — cada request é autocontida. Isso inclui autenticação — o token tem tudo: quem é o usuário, permissões e quando expira.

**Os outros princípios:**

- **Client-Server** — cliente e servidor são independentes, deployam separadamente
- **Cacheable** — responses indicam se podem ser cacheadas via headers
- **Uniform Interface** — contrato previsível em toda a API
- **Layered System** — cliente não sabe quantas camadas existem por trás

---

## 2. Uniform Interface — na prática

**URLs representam recursos — não ações:**

```
// ERRADO — verbos na URL
POST /api/getOrders
POST /api/createOrder
POST /api/deleteOrder

// CORRETO — substantivos na URL, verbo é o método HTTP
GET    /api/orders          // lista pedidos
POST   /api/orders          // cria pedido
GET    /api/orders/123      // busca pedido específico
PUT    /api/orders/123      // substitui pedido completo
PATCH  /api/orders/123      // atualiza campos específicos
DELETE /api/orders/123      // remove pedido
```

**Métodos HTTP com semântica correta:**

| Método | Semântica | Idempotente |
|---|---|---|
| GET | Busca dados | Sim |
| POST | Cria recurso | Não |
| PUT | Substitui recurso completo | Sim |
| PATCH | Atualiza campos específicos | Não necessariamente |
| DELETE | Remove recurso | Sim |

**PUT vs PATCH — muito cobrado em entrevistas:**

```json
// Recurso atual
{ "id": 1, "name": "Gabriel", "email": "old@email.com", "role": "user" }

// PUT — substitui tudo, campos omitidos viram null
PUT /api/users/1
{ "name": "Gabriel", "email": "new@email.com" }
// resultado: { "id": 1, "name": "Gabriel", "email": "new@email.com", "role": null }

// PATCH — atualiza só o que foi enviado
PATCH /api/users/1
{ "email": "new@email.com" }
// resultado: { "id": 1, "name": "Gabriel", "email": "new@email.com", "role": "user" }
```

Na prática, PATCH é preferido — você raramente quer substituir um recurso inteiro.

**Formato de response consistente:**

```json
// Sucesso com um recurso
{ "data": { "id": 1, "status": "pending" }, "errors": null }

// Sucesso com lista
{
  "data": [...],
  "meta": { "total": 150, "page": 1, "per_page": 20 },
  "errors": null
}

// Erro
{
  "data": null,
  "errors": [
    { "field": "email", "message": "Email inválido" }
  ]
}
```

---

## 3. Versionamento

Permite evoluir a API sem quebrar clientes existentes.

**Estratégia recomendada — versão na URL:**

```
GET /api/v1/orders
GET /api/v2/orders
```

Explícito, fácil de debugar, convenção mais adotada no mercado.

**Quando criar nova versão:**

| Tipo de mudança | Precisa de nova versão |
|---|---|
| Remover campo da response | Sim — breaking change |
| Mudar tipo de um campo | Sim — breaking change |
| Mudar nome de um campo | Sim — breaking change |
| Adicionar campo novo | Não — non-breaking |
| Adicionar endpoint novo | Não — non-breaking |

```json
// v1
{ "id": 1, "name": "Gabriel" }

// v2 — breaking change — campo dividido
{ "id": 1, "firstName": "Gabriel", "lastName": "Fonseca" }

// Ainda v1 — adicionou campo, não quebra clientes
{ "id": 1, "name": "Gabriel", "avatar": "foto.jpg" }
```

**Processo de deprecação:**

```
1. Lança v2
2. Anuncia deprecação da v1 com data de fim
3. Período de migração — 3, 6, 12 meses
4. Desliga v1
```

---

## 4. Segurança

```
Request chega
  → HTTPS — criptografia em trânsito
    → Rate Limiting — proteção contra abuso
      → Autenticação — quem é você?
        → Autorização — o que você pode fazer?
          → Validação de input — os dados são seguros?
```

**HTTPS — obrigatório:**

Sem HTTPS, tokens e dados sensíveis trafegam em texto puro. Na AWS isso é feito via Certificate Manager + API Gateway.

**Rate Limiting:**

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // janela de 1 minuto
  max: 100,            // máximo 100 requests por janela
  message: { error: 'Rate limit exceeded. Try again in 60 seconds.' }
});

app.use('/api/', limiter);
```

Na AWS, API Gateway tem rate limiting nativo — sem código adicional.

**Autenticação vs Autorização:**

```
Autenticação — quem é você? → valida o token JWT
Autorização  — o que você pode fazer? → verifica permissões
```

```javascript
// Middleware de autenticação
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = await verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Middleware de autorização
function authorize(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    next();
  };
}

// Uso nas rotas
app.get('/api/orders', authenticate, handler);
app.delete('/api/orders/:id', authenticate, authorize('admin'), handler);
```

**Validação de input — Zod:**

```typescript
import { z } from 'zod';

const CreateOrderSchema = z.object({
  customerId: z.number().positive(),
  items: z.array(z.object({
    productId: z.number().positive(),
    quantity: z.number().min(1).max(100),
  })).min(1),
  status: z.enum(['pending', 'completed', 'cancelled']),
});

app.post('/api/orders', (req, res) => {
  const result = CreateOrderSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.errors });
  }
  const validatedData = result.data; // tipado e validado — previne SQL injection e XSS
});
```

**Nunca exponha dados sensíveis:**

```javascript
// ERRADO
res.json(user);

// CORRETO
const { password, resetToken, ...publicUser } = user;
res.json(publicUser);
```

---

## 5. Idempotência

Uma operação é idempotente quando executá-la várias vezes produz o mesmo resultado.

| Método | Idempotente |
|---|---|
| GET | Sim |
| PUT | Sim |
| DELETE | Sim |
| PATCH | Não necessariamente |
| POST | Não |

**O problema:**

```
POST /api/orders — NÃO idempotente
Primeira request  → cria pedido #123
Conexão cai, usuário clica de novo
Segunda request   → cria pedido #124 — duplicata
```

**A solução — Idempotency Key:**

O cliente gera uma chave única **antes** de enviar — assim pode reenviar com a mesma chave:

```javascript
// Cliente
const idempotencyKey = crypto.randomUUID();

await axios.post('/api/orders', orderData, {
  headers: { 'Idempotency-Key': idempotencyKey }
});

// Servidor
app.post('/api/orders', async (req, res) => {
  const key = req.headers['idempotency-key'];

  const existing = await cache.get(key);
  if (existing) return res.status(200).json(existing); // já processado

  const order = await createOrder(req.body);
  await cache.set(key, order, { ttl: 24 * 60 * 60 });

  res.status(201).json(order);
});
```

Especialmente importante em operações financeiras — nunca cobrar o cliente duas vezes.

---

## 6. Design de endpoints

**Hierarquia de recursos — máximo 2 níveis:**

```
// Correto
GET /api/vendors/123/services

// Evitar — difícil de ler
GET /api/users/123/orders/456/items/789/reviews/101

// Se o recurso filho tem ID próprio, use rota raiz
GET /api/reviews/101
```

**Ações que não se encaixam em CRUD:**

```
// ERRADO — verbo na URL
POST /api/orders/123/cancel

// CORRETO — substantivo como sub-recurso
POST /api/orders/123/cancellation
{ "reason": "Cliente desistiu" }

// Ou PATCH no status para ações simples
PATCH /api/orders/123
{ "status": "cancelled" }
```

**Filtering, sorting e paginação — sempre query params:**

```
GET /api/orders?status=pending&sort=createdAt&order=desc&page=1&per_page=20
```

**Nomenclatura consistente:**

```
// Plural para coleções
GET /api/orders      // correto
GET /api/order       // errado

// kebab-case para múltiplas palavras
GET /api/order-items      // correto
GET /api/orderItems       // errado

// Nunca expor tecnologia
GET /api/v1/orders        // correto
GET /api/mysql/orders     // errado
```

---

## 7. HTTP Status Codes

| Situação | Status |
|---|---|
| GET, PUT, PATCH bem sucedidos | 200 |
| POST bem sucedido | 201 |
| DELETE bem sucedido | 204 |
| Input inválido / formato errado | 400 |
| Sem token / token inválido | 401 |
| Token válido, sem permissão | 403 |
| Recurso não encontrado | 404 |
| Conflito com estado atual | 409 |
| Regra de negócio falhou | 422 |
| Rate limit atingido | 429 |
| Erro inesperado no servidor | 500 |

**401 vs 403 — o mais cobrado:**

```
401 — "Eu não sei quem você é" — sem token ou token inválido
403 — "Eu sei quem você é, mas não pode fazer isso" — sem permissão
```

**400 vs 422:**

```
400 — formato inválido, nem chegou a processar
422 — formato válido, mas regra de negócio falhou (email já cadastrado)
```

**500 — nunca exponha detalhes internos:**

```javascript
// ERRADO
res.status(500).json({ error: err.stack });

// CORRETO
console.error(err); // loga internamente
res.status(500).json({ error: 'Internal server error' });
```

---

## Perguntas de entrevista — respostas modelo

**"O que é uma API RESTful?"**
> "REST é um conjunto de princípios arquiteturais. O mais importante é stateless — cada request contém toda a informação necessária, incluindo autenticação via token. Uniform interface garante um contrato previsível — URLs representam recursos com substantivos, métodos HTTP têm semântica correta, e o formato de response é consistente em toda a API."

**"Qual a diferença entre PUT e PATCH?"**
> "PUT substitui o recurso inteiro — campos omitidos viram null. PATCH atualiza apenas os campos enviados. Na prática prefiro PATCH para updates — é mais seguro porque não sobrescreve campos que não foram enviados."

**"Como você versiona uma API?"**
> "Uso versão na URL — `/api/v1/orders` — por ser explícito e fácil de debugar. Crio nova versão apenas para breaking changes — remover campos, mudar tipos. Adicionar campos novos não quebra clientes existentes. Quando lanço nova versão, mantenho a anterior com data de deprecação para dar tempo de migração."

**"Como você garante segurança em uma API REST?"**
> "Segurança funciona em camadas. HTTPS obrigatório. Rate limiting para proteger contra DDoS — na AWS é nativo no API Gateway. Autenticação via JWT valida quem é o usuário, autorização em middleware separado verifica permissões. Validação de input com Zod previne SQL injection e XSS. E nunca exponho dados sensíveis nas responses."

**"O que é idempotência e por que importa?"**
> "Uma operação idempotente produz o mesmo resultado independente de quantas vezes é executada. GET, PUT e DELETE são idempotentes por natureza. POST não é — pode criar duplicatas. Para operações críticas como pagamentos, implemento com Idempotency-Key gerada pelo cliente. O servidor verifica se já processou aquela chave antes de processar novamente."
