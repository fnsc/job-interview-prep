# Node.js + Express

## O modelo assíncrono

No PHP, cada request abre uma thread própria — o processo espera o banco responder antes de continuar. No Node.js, há um único processo que nunca fica parado:

```
Request 1 chega → delega query ao banco → continua
Request 2 chega → delega query ao banco → continua
banco responde request 1 → processa → retorna
banco responde request 2 → processa → retorna
```

Isso é possível graças ao modelo **non-blocking** e ao `async/await`.

**A analogia:** PHP é um restaurante onde cada cliente tem seu próprio garçom. Node.js é um garçom que atende vários clientes — enquanto a cozinha prepara um pedido, ele já anotou o próximo.

---

## async/await

Toda operação que sai do JavaScript para outro lugar — banco, API externa, disco — é assíncrona e precisa de `await`:

```typescript
// await para operações externas
const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
const response = await axios.get('/api/orders');
const file = await fs.readFile('arquivo.txt');

// Sem await para operações internas
const filtered = orders.filter(o => o.status === 'pending');
const total = orders.reduce((sum, o) => sum + o.value, 0);
```

**A regra do cascata:**
- `await` só funciona dentro de função `async`
- Função `async` sempre retorna `Promise<T>`
- Quem chama uma função `async` também precisa de `await`

```typescript
async function fetchOrder(id: number): Promise<Order> {
  const response = await axios.get(`/api/orders/${id}`);
  return response.data;
}

async function handler() {
  const order = await fetchOrder(1); // precisa de await — fetchOrder é async
  res.json(order);
}
```

**Promise.all — operações independentes em paralelo:**

```typescript
// LENTO — espera uma para começar a outra
const user = await fetchUser(id);
const orders = await fetchOrders(id);

// RÁPIDO — executa as duas ao mesmo tempo
const [user, orders] = await Promise.all([
  fetchUser(id),
  fetchOrders(id)
]);
```

---

## Express — estrutura básica

```typescript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

const app = express();

// Middlewares globais
app.use(express.json());  // parse do body JSON
app.use(helmet());        // headers de segurança
app.use(cors({ origin: process.env.FRONTEND_URL }));

// Rotas
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/users', userRoutes);

app.listen(3000);
```

---

## Middlewares — o conceito mais importante

Função que roda **entre** a request chegar e a response sair. A request passa por uma fila de middlewares antes de chegar no handler final.

```javascript
function middleware(req, res, next) {
  // req — dados da request
  // res — objeto de response
  // next — chama o próximo middleware
  
  // sem next(), a request trava aqui
  next();
}
```

**O fluxo:**

```
Request chega
  → Middleware global (logger, cors, helmet)
    → Middleware de rota (authenticate)
      → Middleware de rota (authorize)
        → Handler (processa e retorna response)
```

**Na prática:**

```typescript
// Middleware de autenticação
async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = await verifyToken(token);
    req.user = decoded; // anexa usuário ao request para uso posterior
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Middleware de autorização
function authorize(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    next();
  };
}

// Uso nas rotas
router.get('/', authenticate, handler);
router.delete('/:id', authenticate, authorize('admin'), handler);
```

---

## Estrutura MVC — para projetos simples

```
src/
  routes/          ← define endpoints e middlewares
  controllers/     ← recebe request, retorna response
  services/        ← lógica de negócio
  models/          ← acesso ao banco
  middlewares/     ← autenticação, autorização, validação
  app.ts           ← configura o Express
  server.ts        ← inicia o servidor
```

**Equivalência com Symfony/Laravel:**

```
Symfony/Laravel          Node.js + Express
─────────────────────────────────────────
routes.yaml          →   routes/
Controller           →   controllers/
Service              →   services/
Entity/Repository    →   models/
EventSubscriber      →   middlewares/
```

**Como as camadas conversam:**

```typescript
// routes/orders.ts — só define endpoints
const router = Router();
router.get('/', authenticate, OrderController.list);
router.post('/', authenticate, OrderController.create);
export default router;

// controllers/OrderController.ts — recebe request, retorna response
export class OrderController {
  static async list(req: Request, res: Response) {
    try {
      const orders = await OrderService.findAll(req.query);
      res.status(200).json({ data: orders });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const order = await OrderService.create(req.body, req.user);
      res.status(201).json({ data: order });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// services/OrderService.ts — lógica de negócio, sem saber sobre HTTP
export class OrderService {
  static async findAll(filters: any) {
    return OrderModel.findAll(filters);
  }

  static async create(data: CreateOrderDTO, user: User) {
    if (!user.isVerified) throw new Error('User not verified');
    return OrderModel.create({ ...data, customerId: user.id });
  }
}
```

**Responsabilidade de cada camada:**

| Camada | Responsabilidade | Não deve |
|---|---|---|
| Route | Definir endpoints e middlewares | Ter lógica de negócio |
| Controller | Receber request, retornar response | Acessar banco diretamente |
| Service | Lógica de negócio | Saber sobre HTTP (req/res) |
| Model | Acesso ao banco | Ter lógica de negócio |

---

## Estrutura DDD + Clean Architecture — para domínios complexos

Para projetos com domínio rico e regras de negócio complexas:

```
src/
  domain/              ← entidades, value objects, regras puras
    order/
      Order.ts         ← entidade
      OrderStatus.ts   ← value object
      OrderRepository.ts ← interface — não implementação
  application/         ← casos de uso
    order/
      CreateOrder.ts
      CancelOrder.ts
  infrastructure/      ← detalhes técnicos
    database/
      PrismaOrderRepository.ts ← implementação do repository
    http/
      routes/
      controllers/
  shared/              ← utilitários compartilhados
```

**A regra central:** o domínio não sabe nada sobre banco ou HTTP. A infraestrutura implementa as interfaces do domínio.

**Quando usar cada abordagem:**

| Abordagem | Quando usar |
|---|---|
| MVC simples | CRUD, projetos pequenos, APIs simples |
| DDD + Clean Arch | Domínio rico, regras de negócio complexas, times grandes |

---

## Perguntas de entrevista — respostas modelo

**"Como você estruturaria uma API Node.js?"**
> "Depende da complexidade do domínio. Para projetos mais simples, uso MVC com routes, controllers, services e models — cada camada com uma responsabilidade única. Para domínios mais complexos, prefiro DDD com Clean Architecture — domínio isolado sem conhecimento de infraestrutura, casos de uso na camada de aplicação, e detalhes técnicos na infraestrutura. Essa separação facilita manutenção e testes independente da abordagem."

**"O que é um middleware no Express?"**
> "Middleware é uma função que roda entre a request chegar e o handler processar. Recebe req, res e next — se não chamar next(), a request trava ali. É onde coloco autenticação, autorização, rate limiting, validação de input e logging. O Express executa os middlewares em sequência — ordem importa."

**"Qual a diferença entre Node.js e PHP no modelo de execução?"**
> "PHP abre uma thread por request — o processo fica bloqueado esperando o banco responder. Node.js tem um único processo non-blocking — enquanto espera o banco, continua atendendo outras requests. Isso é possível graças ao modelo assíncrono com async/await. O trade-off é que operações CPU-intensivas podem travar o único processo do Node.js, enquanto no PHP isso é isolado por thread."
