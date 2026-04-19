# React Routing

## A analogia com PHP/Symfony

No PHP, o roteamento acontece no servidor — cada URL é uma nova request que retorna HTML completo:

```
GET /orders → Symfony busca dados → renderiza template → retorna HTML
```

No React (SPA), o servidor entrega **um único HTML**. O React Router intercepta a navegação no cliente e troca os componentes na tela sem recarregar a página.

---

## Arquitetura moderna — duas aplicações separadas

```
Browser acessa meusite.ca
  → Vercel / S3+CloudFront retorna index.html + bundle JS
  → React Router assume o roteamento no browser
  → Componentes fazem requests para api.meusite.ca (AWS)
  → API retorna JSON
  → React renderiza os dados na tela
```

| | Frontend | Backend |
|---|---|---|
| Onde roda | Vercel / AWS S3+CloudFront | AWS / Railway |
| O que entrega | HTML + JS + CSS | JSON |
| Roteamento | React Router | Rotas de API |

As responsabilidades são separadas — frontend cuida da navegação, backend cuida dos dados.

---

## Configuração básica

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="*" element={<NotFound />} /> {/* catch-all — 404 */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Parâmetros de rota

```javascript
// URL: /orders/123
function OrderDetail() {
  const { id } = useParams(); // pega o :id da URL

  const { data: order } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => fetchOrder(id),
  });

  return <div>{order?.title}</div>;
}
```

---

## Query params

Importante para filtros de busca — o usuário pode compartilhar ou favoritar uma URL com filtros específicos:

```javascript
// URL: /orders?status=pending&page=2
function OrderList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status'); // 'pending'
  const page = searchParams.get('page');     // '2'

  function handleFilterChange(newStatus) {
    setSearchParams({ status: newStatus, page: 1 }); // atualiza a URL
  }
}
```

---

## Navegação programática

```javascript
import { useNavigate } from 'react-router-dom';

function OrderForm() {
  const navigate = useNavigate();

  async function handleSubmit(data) {
    await createOrder(data);
    navigate('/orders');  // redireciona após criar
    // navigate(-1)       // volta para a página anterior
  }
}
```

Equivalente ao `header('Location: /orders')` do PHP — mas no cliente.

---

## Rotas Protegidas — o mais cobrado em entrevistas

Como proteger rotas que só usuários autenticados podem acessar:

```javascript
// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) return <p>Carregando...</p>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />; // redireciona para login
  }

  return children; // usuário autenticado — renderiza a rota
}

// Uso no App.jsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/login" element={<LoginPage />} />

  {/* rotas protegidas */}
  <Route path="/orders" element={
    <ProtectedRoute>
      <OrderList />
    </ProtectedRoute>
  } />

  <Route path="/orders/:id" element={
    <ProtectedRoute>
      <OrderDetail />
    </ProtectedRoute>
  } />
</Routes>
```

---

## CORS — o problema mais comum em arquiteturas separadas

Quando frontend e backend estão em domínios diferentes, o browser bloqueia requests por padrão:

```
Frontend: meuapp.vercel.app
Backend:  api.railway.app

Browser bloqueia — origens diferentes
```

**CORS é sempre resolvido no backend:**

```javascript
// Node.js com Express
import cors from 'cors';

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://meuapp.vercel.app']
  : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**Preflight request — detalhe importante:**

Requests com headers customizados (como `Authorization: Bearer token`) disparam uma request prévia com método `OPTIONS` antes da request real. O backend precisa responder corretamente:

```javascript
app.options('*', cors()); // o pacote cors faz isso automaticamente
```

**Regras do CORS:**
- Sempre resolvido no backend — nunca no frontend
- Em desenvolvimento libera localhost, em produção só o domínio real
- O erro `blocked by CORS policy` no browser significa configuração faltando no servidor

---

## Hospedagem de frontend na AWS

Para empresas que já têm infraestrutura na AWS, o padrão é **S3 + CloudFront**:

```
Browser acessa meusite.ca
  → CloudFront (CDN global)
      → arquivos estáticos do S3
      → index.html + bundle JS + CSS
```

| | Vercel | AWS S3 + CloudFront |
|---|---|---|
| Configuração | Zero — automático | Manual |
| CI/CD | Integrado com GitHub | GitHub Actions / CodePipeline |
| Quando usar | Times pequenos, projetos novos | Empresas com infraestrutura AWS |

---

## Perguntas de entrevista — respostas modelo

**"Como você protege rotas que exigem autenticação?"**
> "Crio um componente ProtectedRoute que verifica o estado de autenticação — no caso da BCAA com Auth0, uso o hook useAuth0. Se o usuário não está autenticado, redireciono para login com Navigate. Se está, renderizo o componente filho normalmente. Esse componente envolve qualquer rota que precise de proteção no App.jsx."

**"O que é CORS e como você resolve?"**
> "CORS é uma política do browser que bloqueia requests entre domínios diferentes por segurança. É sempre resolvido no backend — você configura quais origens têm permissão para acessar a API. Em desenvolvimento libero localhost, em produção só o domínio real do frontend. Requests com Authorization header disparam um preflight OPTIONS que o backend também precisa responder."

**"Qual a diferença entre roteamento no PHP e no React?"**
> "No PHP, o servidor recebe a URL, processa e retorna HTML completo — cada navegação é uma nova request ao servidor. No React, o servidor entrega um único HTML e o React Router assume o roteamento no browser, trocando componentes sem recarregar a página. O backend vira uma API que só retorna JSON — as duas aplicações são deployadas separadamente."
