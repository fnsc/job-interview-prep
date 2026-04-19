# React — Resumo Geral

## O mapa mental do React

### 1. Lifecycle & Hooks — a base de tudo

- **`useState`** — guarda estado local, re-renderiza quando muda
- **`useEffect`** — executa código em resposta ao ciclo de vida. Array de dependências controla quando roda. Sempre fazer cleanup para evitar memory leaks
- **`useRef`** — guarda valor sem re-render. Útil para timers, DOM, valores anteriores
- **`useCallback`** — referência estável de função. Só faz sentido com `React.memo` ou como dependência de `useEffect`
- **`useMemo`** — resultado estável de cálculo pesado. Não usar indiscriminadamente

---

### 2. State Management — onde o estado vive

Começa sempre pelo nível mais baixo:

```
useState local
  → props (lifting state up)
    → Context API (dado global que muda pouco)
      → Zustand (estado global complexo)
        → React Query (dados do servidor)
```

Redux misturava tudo num lugar só — hoje temos ferramentas especializadas para cada responsabilidade.

---

### 3. Performance — evitar re-renders desnecessários

- **`React.memo`** — evita re-render do filho quando props não mudaram
- **`useCallback`** + **`React.memo`** — precisam ser usados juntos quando há funções como props
- **`React.lazy`** + **`Suspense`** — code splitting, carrega componentes sob demanda
- **Regra mais importante:** não otimize antes de medir com React DevTools Profiler

---

### 4. Component Patterns — como organizar componentes

- **Controlled** — React é dono do valor do input. Padrão para formulários com lógica
- **Uncontrolled** — DOM é dono do valor. Apenas em casos específicos
- **Custom hooks** — extrai lógica reutilizável que usa outros hooks. Nome sempre começa com `use`
- **Compound components** — componentes que só fazem sentido juntos. Você vai consumir, não construir

---

### 5. Data Fetching — como buscar dados

Cada camada tem uma responsabilidade:

```
Componente → Custom Hook → React Query → Service → Axios → Interceptor → API
```

- **Axios interceptor** — autenticação (Bearer token) e erros globais (401, 500)
- **React Query** — cache, retry, deduplicação, estado de loading/erro no componente
- **Optimistic updates** — atualiza UI antes do servidor confirmar, reverte se falhar

---

### 6. Roteamento — navegação no cliente

- **React Router** — substitui o roteamento do servidor no cliente
- **Rotas protegidas** — `ProtectedRoute` com Auth0 redireciona não autenticados
- **Query params** — filtros de busca ficam na URL para compartilhamento
- **CORS** — problema de origens diferentes, sempre resolvido no backend

---

## Como tudo se conecta num cenário real

Imagina a página de pedidos do marketplace da BCAA:

```
URL: /orders?status=pending
  → React Router renderiza OrderList
    → ProtectedRoute verifica Auth0
      → useOrders({ status: 'pending' }) — custom hook
        → React Query verifica cache
          → fetchOrders — service function
            → Axios instance com Bearer token
              → GET api.bcaa.com/orders?status=pending
                → Response interceptor trata erros globais
                  → React Query popula data/error/isLoading
                    → OrderList renderiza com useMemo para ordenação local
                      → ExpensiveChild com React.memo evita re-renders
```

---

## O que você já consegue responder em entrevista

- Como funciona o ciclo de vida de um componente React
- Como decidir onde o estado vive
- Como evitar re-renders desnecessários e quando não se preocupar com isso
- Como estruturar data fetching em projetos grandes
- Como proteger rotas com Auth0
- Como resolver CORS em arquiteturas separadas

---

## Arquivos de referência

| Tópico | Arquivo |
|---|---|
| Lifecycle & Hooks | `react_hooks.md` |
| State Management | `react_state_management.md` |
| Performance | `react_performance.md` |
| Component Patterns | `react_component_patterns.md` |
| Data Fetching | `react_data_fetching.md` |
| Roteamento | `react_routing.md` |
