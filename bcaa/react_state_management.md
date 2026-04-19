# React State Management

## O problema central

À medida que a aplicação cresce, você precisa decidir **onde o estado vive**. A regra geral é: o estado deve viver no nível mais baixo possível da árvore que ainda atende a todos que precisam dele.

---

## As 4 camadas — do mais simples ao mais complexo

### Camada 1 — Local State (`useState`)

Estado que só interessa a um componente.

```javascript
function SearchInput() {
  const [query, setQuery] = useState('');

  return (
    <input
      value={query}
      onChange={e => setQuery(e.target.value)}
    />
  );
}
```

**Use quando:** o dado não precisa sair do componente.

---

### Camada 2 — Lifting State Up + Props

Estado compartilhado entre componentes irmãos — você sobe o estado para o pai comum.

```javascript
function OrderPage() {
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <div>
      <OrderList onSelect={setSelectedOrder} />
      <OrderDetail order={selectedOrder} />
    </div>
  );
}
```

**Use quando:** dois ou três componentes próximos precisam do mesmo dado.

**Limite — Prop Drilling:** quando você começa a passar props por componentes intermediários que não usam o dado — só repassam. Isso dificulta manutenção e é o problema que motiva Context.

```
PageRoot         ← tem o dado `user`
  └── Header     ← recebe `user` só pra repassar
        └── Nav  ← recebe `user` só pra repassar
              └── UserAvatar  ← esse aqui REALMENTE precisa de `user`
```

---

### Camada 3 — Context API

Disponibiliza um valor para qualquer componente dentro do Provider sem passar por props.

```javascript
// 1. Cria o contexto
const AuthContext = createContext();

// 2. Provider envolve a árvore
function App() {
  const [user, setUser] = useState(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router />
    </AuthContext.Provider>
  );
}

// 3. Qualquer componente filho consome diretamente
function UserAvatar() {
  const { user } = useContext(AuthContext);
  return <img src={user.avatar} />;
}
```

**Use quando:** dado precisa estar disponível em muitos lugares — usuário logado, tema, idioma, permissões.

**Limite:** quando o valor do Provider muda, **todos** os componentes que consomem esse contexto re-renderizam, mesmo que só usem uma parte do dado. Evite colocar no Context dados que mudam com frequência.

---

### Camada 4 — Zustand (ou Redux)

Para estado global complexo com muitas mutações e muitos consumidores.

**Zustand** — preferido em projetos modernos por ser simples e direto:

```javascript
import { create } from 'zustand';

const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set(state => ({
    items: [...state.items, item]
  })),
  removeItem: (id) => set(state => ({
    items: state.items.filter(i => i.id !== id)
  })),
}));

// Em qualquer componente — cada um assina só o que precisa
function Cart() {
  const { items, removeItem } = useCartStore();
  return items.map(item => (
    <div key={item.id}>
      {item.name}
      <button onClick={() => removeItem(item.id)}>Remover</button>
    </div>
  ));
}
```

**Vantagem sobre Context:** cada componente assina apenas a parte do estado que precisa — sem re-renders desnecessários.

**Use quando:** múltiplos componentes distantes precisam ler e escrever o mesmo estado com frequência.

---

## Dados do servidor — categoria separada

Dados que vêm de API não são estado — são **cache**. Tratá-los como estado local gera complexidade desnecessária: loading manual, race conditions, sem cache, sem invalidação.

**React Query resolve isso:**

```javascript
// Sem React Query — gerenciamento manual
const [orders, setOrders] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetch('/api/orders')
    .then(res => res.json())
    .then(data => { setOrders(data); setIsLoading(false); })
    .catch(err => { setError(err); setIsLoading(false); });
}, []);

// Com React Query — tudo automático
const { data: orders, isLoading, error } = useQuery({
  queryKey: ['orders'],
  queryFn: () => fetch('/api/orders').then(res => res.json())
});
```

---

## O mapa de decisão

```
O dado só interessa a este componente?
  └── Sim → useState local

Dois ou três componentes próximos precisam do dado?
  └── Sim → Lifting state up + props

Muitos componentes distantes precisam, dado muda pouco?
  └── Sim → Context API

Estado global complexo com muitas mutações?
  └── Sim → Zustand

Dado vem do servidor?
  └── Sim → React Query
```

---

## Por que Redux está sendo abandonado

Redux resolvia tudo em um lugar só — dados de servidor, estado de UI, estado local. O problema é exatamente esse: misturar responsabilidades cria complexidade desnecessária.

**Antes — tudo no Redux:**

```javascript
// Store misturava tudo
{
  orders: [],           // dado do servidor
  isLoading: true,      // estado de UI
  error: null,          // estado de UI
  selectedOrder: null,  // estado de UI
  user: {},             // dado do servidor
}
```

Para fazer um simples request, você precisava de: action type, action creator, reducer e middleware async.

**Depois — separação de responsabilidades:**

```javascript
// React Query cuida dos dados do servidor
const { data: orders, isLoading, error } = useQuery(...)

// Zustand cuida do estado de UI global
const { selectedOrder } = useOrderStore()

// useState cuida do estado local
const [searchInput, setSearchInput] = useState('')
```

Cada ferramenta resolve o problema para o qual foi criada.

---

## Como organizar React Query em projetos grandes

Queries inline nos componentes escalam mal. A prática padrão é separar em duas camadas:

**`services/orders.js`** — comunicação com a API:

```javascript
export const fetchOrders = (filters) =>
  fetch(`/api/orders?${new URLSearchParams(filters)}`).then(r => r.json());

export const createOrder = (data) =>
  fetch('/api/orders', { method: 'POST', body: JSON.stringify(data) }).then(r => r.json());
```

**`hooks/useOrders.js`** — lógica de cache:

```javascript
import { fetchOrders, createOrder } from '../services/orders';

export function useOrders(filters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders(filters),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}
```

**Nos componentes — sem lógica de fetch:**

```javascript
function OrderList() {
  const { data: orders, isLoading } = useOrders({ status: 'pending' });
}
```

---

## React Query vs Next.js

Não competem — se complementam.

| | React Query | Next.js |
|---|---|---|
| O que é | Biblioteca de cache de dados no cliente | Framework fullstack completo |
| Resolve | Data fetching dinâmico após interação | Roteamento, SSR, bundling, deploy |

**Padrão moderno com Next.js:**

```javascript
// Server Component — dados iniciais no servidor (SEO, first load)
async function OrdersPage() {
  const initialOrders = await fetchOrders();
  return <OrderListClient initialData={initialOrders} />;
}

// Client Component — React Query assume após interação
'use client';
function OrderListClient({ initialData }) {
  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    initialData, // sem loading spinner no primeiro render
  });
}
```

---

## Resposta modelo para entrevista

> "Meu modelo mental começa pelo nível mais baixo possível. Estado que só interessa a um componente fica em `useState`. Quando componentes irmãos precisam do mesmo dado, subo o estado para o pai e passo via props — mas isso tem um limite: quando você começa a passar props por componentes que não usam o dado, você tem prop drilling, que dificulta manutenção.
>
> Para resolver isso, uso Context API para dados globais que mudam pouco — usuário logado, tema, permissões. O limite do Context é que quando o valor muda, todos os consumidores re-renderizam, então evito colocar lá dados que mudam com frequência. Para estado global com muitas mutações, Zustand é mais adequado — cada componente assina só a parte que precisa.
>
> Para dados do servidor, não trato como estado — trato como cache. React Query resolve isso com loading, erro, invalidação e retry automáticos, com muito menos código do que gerenciar manualmente.
>
> Redux resolvia tudo em um lugar só, mas o problema é exatamente esse — misturar dados de servidor com estado de UI num mesmo store cria complexidade desnecessária e muito boilerplate."

---

## Perguntas de entrevista frequentes

**"Como você decide onde colocar o estado?"**
> Começo pelo nível mais baixo. useState local → props → Context → Zustand. Dados de servidor vão para React Query.

**"Qual o problema do Context para estado que muda com frequência?"**
> Quando o valor do Provider muda, todos os consumidores re-renderizam. Para dados que mudam muito, isso gera re-renders desnecessários — Zustand resolve isso.

**"Por que não usar Redux?"**
> Redux mistura dados de servidor com estado de UI no mesmo store. Hoje temos ferramentas especializadas para cada responsabilidade que resultam em menos código e menos complexidade.

**"Qual a diferença entre estado local e estado de servidor?"**
> Estado local é dado que o usuário manipula na interface. Estado de servidor é cache de dados da API. Tratá-los da mesma forma gera complexidade desnecessária — React Query foi criado para separar essas responsabilidades.
