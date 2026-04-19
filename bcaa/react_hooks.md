# React Hooks — Lifecycle & State

## O ciclo de vida de um componente

```
Monta → Atualiza → Desmonta
```

Os hooks são a forma moderna de interagir com esse ciclo.

---

## useState

Guarda estado local. Quando o valor muda, o componente re-renderiza.

```javascript
const [value, setValue] = useState(initialValue);
```

- `value` — valor atual
- `setValue` — função que atualiza o valor e dispara re-render
- `initialValue` — roda apenas uma vez, na montagem

**Regras importantes:**

```javascript
// setValue não muda o valor imediatamente — agenda para o próximo render
const [count, setCount] = useState(0);
setCount(count + 1);
console.log(count); // ainda é 0

// Quando o novo valor depende do anterior, use a forma funcional
setCount(prev => prev + 1);

// Com objetos, sempre crie um novo objeto — React compara por referência
setUser({ ...user, name: "Gabriel" }); // correto
user.name = "Gabriel"; setUser(user);  // errado — não re-renderiza
```

---

## useEffect

Executa código em resposta ao ciclo de vida do componente.

```javascript
useEffect(() => {
  // código aqui
  return () => { /* cleanup */ };
}, [dependências]);
```

**O array de dependências controla quando o efeito roda:**

| Array | Comportamento |
|---|---|
| Sem array | Roda em todo render |
| `[]` vazio | Roda só na montagem |
| `[valor]` | Roda quando `valor` muda |

**Stale closure — o bug mais comum:**

Se você usa uma variável dentro do efeito mas não a inclui no array de dependências, o efeito usa o valor antigo dessa variável:

```javascript
const [userId, setUserId] = useState(1);

useEffect(() => {
  fetchUser(userId); // usa userId
}, []); // userId não está no array — stale closure
// quando userId mudar, o efeito não roda de novo e usa o valor antigo
```

**Cleanup — evitando memory leaks:**

O return do useEffect é executado quando o componente desmonta ou antes do efeito rodar de novo.

```javascript
// Timer
useEffect(() => {
  const interval = setInterval(tick, 1000);
  return () => clearInterval(interval); // sem isso: memory leak
}, []);

// Event listener
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

// WebSocket
useEffect(() => {
  const ws = new WebSocket(url);
  return () => ws.close();
}, []);
```

**Cleanup em requests — evitando race conditions:**

Quando o usuário muda um filtro rapidamente, duas requests podem ser disparadas. A mais lenta pode chegar por último e sobrescrever o resultado correto.

```javascript
useEffect(() => {
  let cancelled = false;

  setIsLoading(true);

  fetch(`/api/orders?status=${status}`)
    .then(res => res.json())
    .then(data => {
      if (!cancelled) { // só atualiza se ainda for válido
        setOrders(data);
        setIsLoading(false);
      }
    });

  return () => { cancelled = true; };
}, [status]);
```

---

## useRef

Guarda um valor entre renders **sem causar re-render** quando muda.

```javascript
const ref = useRef(initialValue);
ref.current; // acessa o valor
ref.current = novoValor; // atualiza sem re-render
```

**Regra prática:** use `useRef` quando você precisa guardar algo entre renders mas não quer que a tela atualize quando esse valor mudar.

**Caso 1 — Acesso direto ao DOM:**

```javascript
function SearchModal() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus(); // foca o input quando o modal abre
  }, []);

  return <input ref={inputRef} placeholder="Buscar..." />;
}
```

**Caso 2 — Guardar valor anterior de um estado:**

```javascript
function PriceDisplay({ price }) {
  const previousPrice = useRef(price);

  useEffect(() => {
    previousPrice.current = price;
  }, [price]);

  return (
    <div>
      <p>Preço atual: {price}</p>
      <p>Preço anterior: {previousPrice.current}</p>
    </div>
  );
}
```

**Caso 3 — Guardar ID de timer:**

```javascript
function OrderTracker() {
  const intervalRef = useRef(null);

  function startTracking() {
    intervalRef.current = setInterval(fetchStatus, 5000);
  }

  function stopTracking() {
    clearInterval(intervalRef.current);
  }

  return (
    <div>
      <button onClick={startTracking}>Iniciar</button>
      <button onClick={stopTracking}>Parar</button>
    </div>
  );
}
```

**useState vs useRef:**

| | useState | useRef |
|---|---|---|
| Re-renderiza quando muda | Sim | Não |
| Uso | Dados que afetam a UI | Valores internos, referências ao DOM |

---

## useCallback

Memoriza uma **função** para evitar que ela seja recriada em todo render.

```javascript
// Sem useCallback — nova função em todo render
const handleClick = () => doSomething(id);

// Com useCallback — mesma função enquanto id não mudar
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

**Quando usar:** quando você passa uma função como prop para um componente filho que usa `React.memo`. Sem isso, o filho re-renderiza de qualquer jeito porque a função é "nova" a cada render.

---

## useMemo

Memoriza o **resultado** de um cálculo para evitar que ele rode em todo render.

```javascript
const result = useMemo(() => {
  return expensiveCalculation(data);
}, [data]); // só recalcula quando data muda
```

**useCallback vs useMemo:**

| | useCallback | useMemo |
|---|---|---|
| Memoriza | Uma função | O resultado de uma função |

**Quando usar:**
- Cálculo genuinamente pesado (filtrar/ordenar listas grandes)
- Resultado passado como prop para componente com `React.memo`

**Quando NÃO usar:**
- Cálculos simples — o overhead do useMemo é maior que o ganho
- Otimização prematura — só aplique quando houver problema de performance identificado

---

## Exemplo completo — filtro + ordenação + paginação

A separação de responsabilidades é o ponto mais importante:

| Hook | Responsabilidade |
|---|---|
| `useState` | Guarda dados e filtros |
| `useEffect` | Busca no backend quando filtro/ordenação/página muda |
| `useMemo` | Calcula valores derivados dos dados já recebidos |

```javascript
function OrderList() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('desc');
  const [page, setPage] = useState(1);

  // Novo request quando qualquer parâmetro muda
  // Ordenação e paginação são resolvidas pelo backend
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/orders?status=${statusFilter}&sort=${sortBy}&page=${page}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) setOrders(data);
      });

    return () => { cancelled = true; };
  }, [statusFilter, sortBy, page]);

  // useMemo para calcular valores derivados dos dados já recebidos
  // sem precisar de novo request
  const pageTotal = useMemo(() => {
    return orders.reduce((sum, order) => sum + order.value, 0);
  }, [orders]);

  return (
    <div>
      <p>Total da página: {pageTotal}</p>

      <select onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
        <option value="all">Todos</option>
        <option value="pending">Pendentes</option>
      </select>

      <select onChange={e => { setSortBy(e.target.value); setPage(1); }}>
        <option value="desc">Mais recente</option>
        <option value="asc">Mais antigo</option>
      </select>

      {orders.map(order => <OrderRow key={order.id} order={order} />)}

      <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>Anterior</button>
      <button onClick={() => setPage(p => p + 1)}>Próxima</button>
    </div>
  );
}
```

**Regra para ordenação com paginação:**

- Ordenação/filtro que o banco precisa resolver → parâmetro do request no `useEffect`
- Cálculo sobre dados já recebidos → `useMemo`

---

## Perguntas de entrevista — respostas modelo

**"O que é o array de dependências do useEffect?"**
> "Controla quando o efeito roda. Se eu omitir uma variável que uso dentro do efeito, o React não vai re-executar o efeito quando ela mudar, e o efeito vai usar um valor desatualizado — isso se chama stale closure e é um dos bugs mais comuns em React."

**"Como você evitaria um memory leak em um componente que faz polling de uma API?"**
> "Usando o cleanup do useEffect — retorno uma função que cancela o interval quando o componente desmonta. Sem isso, o interval continua rodando e tenta atualizar o estado de um componente que não existe mais."

**"Qual a diferença entre useState e useRef?"**
> "Ambos persistem valores entre renders. A diferença é que setState dispara re-render e useRef não. Uso useRef quando preciso guardar um valor mutable sem afetar a renderização — como IDs de timers, referências ao DOM, ou contadores internos."

**"Quando você usaria useMemo?"**
> "Quando tenho uma operação computacionalmente cara que não precisa rodar de novo se as dependências não mudaram. Mas evito usar indiscriminadamente — useMemo tem custo de memória e legibilidade, então só aplico quando há um problema de performance identificado."

**"Qual a diferença entre useCallback e useMemo?"**
> "useCallback memoriza uma função. useMemo memoriza o resultado de uma função."
