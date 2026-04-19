# React Data Fetching

## O mapa completo

```
Componente chama useOrders()
  → React Query verifica o cache
  → se precisar, dispara a request
      → Axios request interceptor (adiciona token)
      → Servidor responde
      → Axios response interceptor (trata 401, 500 globalmente)
      → React Query recebe o resultado
          → sucesso: atualiza cache, data fica disponível no componente
          → erro: tenta retry, depois popula o error no componente
```

---

## Divisão de responsabilidades

| | Axios Interceptor | React Query |
|---|---|---|
| Onde atua | Na request/response em si | No estado da UI |
| Trata | Erros globais (401, 500) | Estado de loading, erro, dados no componente |
| Faz retry | Não | Sim |
| Cancela request duplicada | Não | Sim |
| Guarda cache | Não | Sim |

Os dois trabalham juntos — um não substitui o outro.

---

## 1. Axios Interceptor — configuração completa

Pensa no interceptor como um **middleware** entre você e o servidor. Toda request passa por ele antes de sair, e toda resposta passa por ele antes de chegar no seu código.

```javascript
// services/api.js — instância criada UMA VEZ, fora de qualquer hook
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — roda antes de toda request sair
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // SEMPRE retorna a config
  },
  (error) => Promise.reject(error)
);

// Response interceptor — roda antes de toda resposta chegar
api.interceptors.response.use(
  (response) => response, // 2xx — passa direto

  (error) => {
    const status = error.response?.status;

    // erros globais — comportamento que vale para toda a aplicação
    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    if (status === 403) {
      console.error('Sem permissão para acessar este recurso');
    }

    if (status >= 500) {
      console.error('Erro interno do servidor');
    }

    // propaga o erro para o React Query tratar no componente
    // sem isso, React Query acha que a request teve sucesso
    return Promise.reject(error);
  }
);

export default api;
```

---

## 2. Autenticação com Auth0

Quando o token vem do Auth0 (não do localStorage), use um hook para configurar o interceptor:

```javascript
// hooks/useAxiosAuth.js
import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../services/api';

export function useAxiosAuth() {
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    const interceptor = api.interceptors.request.use(async (config) => {
      const token = await getAccessTokenSilently();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    return () => api.interceptors.request.eject(interceptor); // cleanup — evita interceptors duplicados
  }, [getAccessTokenSilently]);
}

// Uso — chama uma vez no componente raiz
function App() {
  useAxiosAuth(); // configura o interceptor globalmente
  return <Router />;
}
```

---

## 3. Services — comunicação com a API

Importam a instância configurada. Sem lógica de autenticação ou erro — o interceptor cuida.

```javascript
// services/orders.js
import api from './api';

export const fetchOrders = (filters) =>
  api.get('/orders', { params: filters }).then(r => r.data);

export const fetchOrder = (id) =>
  api.get(`/orders/${id}`).then(r => r.data);

export const createOrder = (data) =>
  api.post('/orders', data).then(r => r.data);

export const updateOrder = (id, data) =>
  api.put(`/orders/${id}`, data).then(r => r.data);
```

---

## 4. React Query — estado no componente

O Axios interceptor rejeitou o erro com `Promise.reject`. O React Query captura essa rejeição e popula o `error` do hook automaticamente.

**Sem React Query — você gerencia tudo manualmente:**

```javascript
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  api.get('/orders')
    .then(r => setData(r.data))
    .catch(err => setError(err)) // você guarda o erro no estado
    .finally(() => setIsLoading(false));
}, []);
```

**Com React Query — estado gerenciado automaticamente:**

```javascript
const { data, isLoading, error } = useQuery({
  queryKey: ['orders'],
  queryFn: () => fetchOrders(),
  retry: 2, // tenta mais 2 vezes antes de marcar como erro
});
```

---

## 5. Tratamento de erros no componente

O interceptor trata erros globais (401, 500). O componente trata erros específicos daquele contexto:

```javascript
function OrderList() {
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    retry: 2,
  });

  if (isLoading) return <p>Carregando...</p>;

  if (error) {
    if (error.response?.status === 404) return <p>Nenhum pedido encontrado</p>;
    return <p>Erro ao carregar pedidos</p>;
  }

  return orders.map(o => <OrderRow key={o.id} order={o} />);
}
```

---

## 6. Optimistic Updates

Atualizar a UI **antes** da resposta do servidor — dá sensação de instantaneidade. Se o servidor falhar, reverte.

**Analogia:** quando você curte algo no Instagram, o coração fica vermelho imediatamente. Se perder conexão naquele momento, ele volta para cinza. O Instagram é otimista — assume que vai funcionar.

```javascript
const likeOrder = useMutation({
  mutationFn: (orderId) => api.post(`/orders/${orderId}/like`),

  onMutate: async (orderId) => {
    // 1. Cancela refetch em andamento para não sobrescrever a atualização otimista
    await queryClient.cancelQueries({ queryKey: ['orders'] });

    // 2. Salva estado atual para reverter se falhar
    const previous = queryClient.getQueryData(['orders']);

    // 3. Atualiza UI imediatamente — sem esperar o servidor
    queryClient.setQueryData(['orders'], (old) =>
      old.map(order =>
        order.id === orderId ? { ...order, liked: true } : order
      )
    );

    return { previous };
  },

  onError: (err, orderId, context) => {
    // 4. Algo deu errado — reverte para o estado anterior
    queryClient.setQueryData(['orders'], context.previous);
  },

  onSettled: () => {
    // 5. Sincroniza com o servidor independente de sucesso ou erro
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  },
});
```

**Quando usar:**
- Ações simples com alta taxa de sucesso — curtir, marcar como lido, reordenar
- Quando a latência impacta a experiência do usuário

**Quando NÃO usar:**
- Operações financeiras ou críticas — usuário precisa da confirmação real do servidor
- Quando o servidor pode rejeitar por regras de negócio complexas

---

## 7. Organização em projetos grandes

```
src/
  services/
    api.js          ← instância Axios + interceptors
    orders.js       ← funções de fetch puras
    users.js
  hooks/
    useAxiosAuth.js ← configura token do Auth0
    useOrders.js    ← React Query hooks de orders
    useUsers.js
```

**hooks/useOrders.js — lógica de cache centralizada:**

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const { data: orders, isLoading, error } = useOrders({ status: 'pending' });
  const { mutate: create } = useCreateOrder();
  // componente não sabe nada sobre token, retry ou cache
}
```

---

## Perguntas de entrevista — respostas modelo

**"Como você centraliza autenticação nas requests?"**
> "Uso um interceptor de request no Axios que adiciona o Bearer token em toda request automaticamente. Se o token vem do Auth0, configuro o interceptor em um custom hook chamado no componente raiz da aplicação. Assim nenhum service precisa saber sobre autenticação."

**"Qual a diferença entre o que o Axios interceptor trata e o que o React Query trata?"**
> "O interceptor trata erros globais que valem para toda a aplicação — 401 redireciona para login, 500 loga o erro. O React Query trata o estado do erro no componente — o que mostrar na tela para aquele request específico. O interceptor propaga o erro com Promise.reject para que o React Query possa capturá-lo e disponibilizá-lo no hook."

**"O que são optimistic updates e quando você usaria?"**
> "É atualizar a UI antes da confirmação do servidor, assumindo que a operação vai ter sucesso. Se falhar, revertemos para o estado anterior. Uso em ações simples com alta taxa de sucesso onde a latência impacta a experiência — curtir, marcar como lido. Evito em operações financeiras ou críticas onde o usuário precisa da confirmação real do servidor."
