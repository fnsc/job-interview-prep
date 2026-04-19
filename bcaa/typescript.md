# TypeScript

## Sintaxe básica — onde o tipo fica

No PHP o tipo vem **antes** da variável. No TypeScript vem **depois**, separado por `:`:

```typescript
// PHP
string $name = "Gabriel";

// TypeScript
const name: string = "Gabriel";
const age: number = 30;
const active: boolean = true;
const scores: number[] = [1, 2, 3];
```

**Funções — parâmetros e retorno:**

```typescript
// PHP
function getUser(int $id): array { ... }

// TypeScript
function getUser(id: number): object { ... }

// Async — retorno sempre Promise<T>
async function fetchOrder(id: number): Promise<Order> {
  const response = await axios.get(`/api/orders/${id}`);
  return response.data;
}
```

---

## Interface vs Type

**Interface — descreve a forma de um objeto:**

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}
```

No TypeScript, interface descreve **a forma dos dados** — diferente do PHP onde interface define comportamento obrigatório. No TypeScript você pode usar interface para comportamento também, mas no dia a dia de React e Node.js é quase sempre para forma de objetos.

**Type — mais flexível:**

```typescript
// Objeto — parecido com interface
type User = {
  id: number;
  name: string;
};

// União de valores — interface não faz isso
type Status = 'pending' | 'completed' | 'cancelled';

// Combinação de tipos
type AdminUser = User & { role: 'admin' };
```

**Quando usar cada um:**

| | Interface | Type |
|---|---|---|
| Forma de objeto | Sim | Sim |
| União de valores (`'a' \| 'b'`) | Não | Sim |
| Convenção da comunidade | Objetos e classes | Todo o resto |

---

## Optional properties

```typescript
interface User {
  id: number;
  name: string;
  avatar?: string; // ? = opcional — pode ser string ou undefined
}

// Ambos válidos
const user1: User = { id: 1, name: 'Gabriel', avatar: 'foto.jpg' };
const user2: User = { id: 2, name: 'Gabriel' }; // sem avatar — ok
```

**Operador `??` — nullish coalescing:**

```typescript
// Se avatar for undefined, usa string vazia
const avatar = user.avatar ?? '';

// Mesmo conceito do PHP 8
$avatar = $user->avatar ?? '';
```

**Regra prática:**
- Use `?` quando o campo genuinamente pode não existir
- Habilite `strict: true` no `tsconfig.json` — TypeScript te obriga a tratar opcionais antes de usar
- Evite `?` em campos que sempre devem existir

---

## Generics

Tipo variável — definido na hora de usar a função ou interface.

**O problema sem generics:**

```typescript
// Duplicação — uma função por tipo
function getFirst(arr: number[]): number { return arr[0]; }
function getFirst(arr: string[]): string { return arr[0]; }
```

**Com generics:**

```typescript
function getFirst<T>(arr: T[]): T {
  return arr[0];
}

const first = getFirst([1, 2, 3]);      // T = number
const name = getFirst(['a', 'b', 'c']); // T = string
const user = getFirst(users);            // T = User
```

**Você já usava generics no React:**

```typescript
const [user, setUser] = useState<User | null>(null);
const [orders, setOrders] = useState<Order[]>([]);

const { data } = useQuery<Order[]>({
  queryKey: ['orders'],
  queryFn: fetchOrders,
});
```

**Interface genérica — muito usado em APIs:**

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

type OrdersResponse = PaginatedResponse<Order>;
type UsersResponse = PaginatedResponse<User>;
```

**Generics com restrições:**

```typescript
// T deve ter pelo menos a propriedade id
function findById<T extends { id: number }>(items: T[], id: number): T | undefined {
  return items.find(item => item.id === id);
}
```

---

## Union Types e Discriminated Unions

**Union types básicos:**

```typescript
type ID = number | string;
type Status = 'pending' | 'completed' | 'cancelled';
```

**Discriminated Union — para responses de API:**

```typescript
type OrderResult =
  | { success: true; data: Order }
  | { success: false; error: string };

async function getOrder(id: number): Promise<OrderResult> {
  try {
    const order = await fetchOrder(id);
    return { success: true, data: order };
  } catch (err) {
    return { success: false, error: 'Pedido não encontrado' };
  }
}

// TypeScript sabe o tipo correto em cada bloco
const result = await getOrder(1);

if (result.success) {
  console.log(result.data.status); // TypeScript sabe que data existe
} else {
  console.log(result.error);       // TypeScript sabe que error existe
}
```

**Estados de componente React:**

```typescript
type OrderState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Order }
  | { status: 'error'; message: string };

function OrderDetail() {
  const [state, setState] = useState<OrderState>({ status: 'idle' });

  if (state.status === 'loading') return <p>Carregando...</p>;
  if (state.status === 'error') return <p>{state.message}</p>;
  if (state.status === 'success') return <p>{state.data.total}</p>;
  return <button>Carregar</button>;
}
```

---

## Utility Types

Transformam interfaces existentes sem duplicar código.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}
```

**`Partial<T>` — todas as props ficam opcionais:**

```typescript
type UpdateUser = Partial<User>;
// { id?: number; name?: string; email?: string; password?: string; }

// Útil para PATCH /users/:id
async function updateUser(id: number, data: Partial<User>) {
  return axios.patch(`/api/users/${id}`, data);
}
```

**`Required<T>` — todas as props ficam obrigatórias:**

```typescript
type CompleteUser = Required<User>;
// Remove todos os ? da interface
```

**`Pick<T, Keys>` — pega só as props que você quer:**

```typescript
type PublicUser = Pick<User, 'id' | 'name' | 'email'>;
// { id: number; name: string; email: string; }
// password removido — seguro para expor na API
```

**`Omit<T, Keys>` — pega tudo menos as props que você não quer:**

```typescript
type UserWithoutPassword = Omit<User, 'password'>;
type CreateUser = Omit<User, 'id'>; // id não existe na criação
```

**Pick vs Omit:**

| | Pick | Omit |
|---|---|---|
| Quando usar | Você quer **poucas** props | Você quer **quase tudo** menos algumas |

**Combinando Utility Types:**

```typescript
type CreateUser = Required<Omit<User, 'id'>>;     // sem id, tudo obrigatório
type UpdateUser = Partial<Omit<User, 'id'>>;       // sem id, tudo opcional
type PublicUser = Omit<User, 'password'>;          // sem password

// DTO — Data Transfer Object — convenção para tipos em trânsito
type CreateOrderDTO = Omit<Order, 'id' | 'createdAt'>;
type UpdateOrderDTO = Partial<Omit<Order, 'id' | 'createdAt'>>;
```

---

## Type Narrowing

TypeScript "estreita" o tipo dentro de um bloco baseado em uma verificação.

**`typeof` — para primitivos:**

```typescript
function format(value: number | string) {
  if (typeof value === 'string') {
    return value.toUpperCase(); // string
  }
  return value.toFixed(2); // number
}
```

**`in` — verifica se propriedade existe:**

```typescript
type Cat = { meow: () => void };
type Dog = { bark: () => void };

function makeSound(animal: Cat | Dog) {
  if ('meow' in animal) {
    animal.meow(); // Cat
  } else {
    animal.bark(); // Dog
  }
}
```

**`instanceof` — para classes:**

```typescript
function handleError(error: Error | string) {
  if (error instanceof Error) {
    console.log(error.message);
  } else {
    console.log(error);
  }
}
```

**Verificar opcional antes de usar:**

```typescript
interface User {
  avatar?: string;
}

function showAvatar(user: User) {
  if (user.avatar) {
    console.log(user.avatar.toUpperCase()); // TypeScript sabe que é string aqui
  }
}
```

---

## Type Assertion — `as`

Quando você sabe o tipo mas o TypeScript não consegue inferir. É um cast forçado — só existe em tempo de compilação, não converte nada em runtime.

```typescript
// DOM
const input = document.getElementById('email') as HTMLInputElement;
input.value; // ok

// Response de API
const orders = response.data as Order[];
```

**`as` vs cast do PHP:**

```typescript
// PHP — converte o valor em runtime
$id = (int) "123abc"; // vira 123

// TypeScript — só instrui o compilador, não converte nada
const id = value as number; // value ainda é o que era em runtime
```

**Quando usar:**
- Response de API com tipo conhecido — aceitável
- Você tem certeza absoluta do tipo — aceitável
- Você está "chutando" o tipo — evite

**Alternativa mais segura:**

```typescript
const element = document.getElementById('email');
if (element instanceof HTMLInputElement) {
  element.value; // sem as — mais seguro
}
```

---

## `any` vs `unknown`

| | `any` | `unknown` |
|---|---|---|
| TypeScript verifica | Não | Sim |
| Precisa de narrowing | Não | Sim |
| Seguro | Não | Sim |
| Quando usar | Nunca se possível | Valores genuinamente desconhecidos |

```typescript
// any — desliga o TypeScript completamente
let value: any = 'Gabriel';
value.qualquerCoisa; // TypeScript não reclama — perigoso

// unknown — seguro
let value: unknown = 'Gabriel';
value.toUpperCase(); // ERRO — precisa verificar o tipo

if (typeof value === 'string') {
  value.toUpperCase(); // ok
}
```

**O caso mais comum — bloco catch:**

```typescript
try {
  await fetchOrder(1);
} catch (err) {
  // err é unknown no TypeScript moderno
  if (err instanceof Error) {
    console.log(err.message); // ok
  }
}
```

---

## Perguntas de entrevista — respostas modelo

**"Qual a diferença entre interface e type?"**
> "Interface e type são similares para descrever forma de objetos. A diferença principal é que type é mais flexível — permite união de valores e combinação de tipos com &. Interface permite extensão depois da declaração. Na prática uso interface para objetos e classes, e type para todo o resto — unions, aliases, tipos utilitários."

**"O que são generics e quando você usaria?"**
> "Generics são tipos variáveis definidos na hora de usar uma função ou interface. Uso quando tenho lógica que funciona para múltiplos tipos — como uma função que pega o primeiro item de qualquer array, ou uma interface de resposta paginada que funciona para qualquer entidade. Já uso generics no useState e useQuery do React Query sem perceber."

**"Qual a diferença entre any e unknown?"**
> "any desliga completamente a verificação de tipos — você perde toda a proteção do TypeScript. unknown é o tipo seguro para valores desconhecidos — você ainda precisa fazer narrowing antes de usar. Prefiro unknown especialmente em blocos catch. any só uso como último recurso em integrações com código legado sem tipos."

**"Como você evita re-renders desnecessários em React?"**
> "Re-renders desnecessários acontecem quando o pai re-renderiza e os filhos re-renderizam junto sem mudança nas props. Uso React.memo no filho para evitar isso. Mas se uma prop for uma função, preciso de useCallback no pai para manter a referência estável — os dois precisam ser usados juntos. Para cálculos pesados uso useMemo. Antes de qualquer otimização, meço com React DevTools Profiler — otimização prematura tem custo de legibilidade e memória."
