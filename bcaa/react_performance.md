# React Performance

## O problema central

React re-renderiza um componente sempre que:

1. O estado dele muda (`useState`)
2. Uma prop que ele recebe muda
3. O componente pai re-renderiza — **mesmo que as props do filho não mudaram**

O ponto 3 é onde mora a maioria dos problemas de performance.

---

## Mapa mental — qual problema cada ferramenta resolve

| Ferramenta | Problema que resolve |
|---|---|
| `React.memo` | Evitar re-render de filho quando props não mudaram |
| `useCallback` | Referência estável de função entre renders |
| `useMemo` | Resultado estável de cálculo pesado entre renders |
| `React.lazy` + `Suspense` | Carregar componentes pesados sob demanda |

---

## React.memo

Evita que um componente filho re-renderize quando o pai re-renderiza, desde que suas props não tenham mudado.

```javascript
// Sem React.memo — re-renderiza toda vez que o pai atualiza
function ExpensiveChild() {
  console.log('renderizou');
  return <div>Conteúdo pesado</div>;
}

// Com React.memo — só re-renderiza se suas props mudarem
const ExpensiveChild = React.memo(function ExpensiveChild() {
  console.log('renderizou');
  return <div>Conteúdo pesado</div>;
});
```

**Limite — props com funções:**

`React.memo` compara props por referência. Funções têm referência nova a cada render do pai — então o memo não funciona sozinho quando há funções como props:

```javascript
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = () => console.log('clicou'); // nova referência em todo render

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <ExpensiveChild onClick={handleClick} /> {/* re-renderiza de qualquer jeito */}
    </>
  );
}
```

---

## useCallback

Mantém a mesma referência de uma função entre renders enquanto suas dependências não mudam.

```javascript
const handleClick = useCallback(() => {
  doSomething(userId);
}, [userId]); // nova referência só quando userId mudar
```

**Importante:** "mesma referência" é mais preciso que "mesma função". Quando uma dependência muda, o `useCallback` cria uma nova função. Se você esquecer de incluir uma dependência — stale closure, o mesmo problema do `useEffect`.

---

## React.memo + useCallback — precisam ser usados juntos

Esse é o ponto mais importante sobre performance em React.

**`React.memo` sozinho não resolve quando há funções como props:**

```javascript
const Child = React.memo(({ onClick }) => {
  console.log('renderizou');
  return <button onClick={onClick}>Clica</button>;
});

function Parent() {
  const [count, setCount] = useState(0);
  const handleClick = () => console.log('clicou'); // nova referência em todo render

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <Child onClick={handleClick} /> {/* re-renderiza de qualquer jeito */}
    </>
  );
}
```

**`useCallback` sozinho não resolve sem `React.memo` no filho:**

```javascript
function Parent() {
  const handleClick = useCallback(() => console.log('clicou'), []);
  return <Child onClick={handleClick} />; // filho re-renderiza sempre mesmo assim
}

function Child({ onClick }) { // sem React.memo — re-renderiza sempre
  return <button onClick={onClick}>Clica</button>;
}
```

**A combinação correta:**

```javascript
// Filho com React.memo
const Child = React.memo(({ onClick }) => {
  console.log('renderizou');
  return <button onClick={onClick}>Clica</button>;
});

// Pai com useCallback
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log('clicou');
  }, []); // mesma referência — memo funciona

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <Child onClick={handleClick} /> {/* não re-renderiza */}
    </>
  );
}
```

---

## useCallback — segundo caso válido

Fora de `React.memo`, `useCallback` também faz sentido quando a função é usada como dependência de `useEffect` — evita loop infinito:

```javascript
function Parent() {
  const fetchOrders = useCallback(() => {
    return fetch('/api/orders').then(r => r.json());
  }, []); // sem useCallback — nova referência em todo render

  useEffect(() => {
    let cancelled = false;

    fetchOrders().then(data => {
      if (!cancelled) setOrders(data);
    });

    return () => { cancelled = true; }; // cleanup ainda necessário
  }, [fetchOrders]); // sem useCallback — loop infinito
}
```

**Importante:** `useCallback` resolve a referência estável. O cleanup ainda é necessário para cancelar a operação quando o componente desmonta. São problemas diferentes e independentes.

---

## Os dois casos válidos para useCallback

| Caso | Por quê |
|---|---|
| Função passada como prop para componente com `React.memo` | Mantém referência estável para o memo funcionar |
| Função usada como dependência de `useEffect` | Evita loop infinito |

Fora desses dois casos, `useCallback` não agrega nada.

---

## useMemo

Memoriza o resultado de um cálculo pesado entre renders.

```javascript
// Sem useMemo — recalcula em todo render
const sortedOrders = orders.sort((a, b) => b.value - a.value);

// Com useMemo — só recalcula quando orders mudar
const sortedOrders = useMemo(() => {
  return [...orders].sort((a, b) => b.value - a.value);
}, [orders]);
```

**Quando usar:**
- Cálculo genuinamente pesado (filtrar/ordenar listas grandes)
- Resultado passado como prop para componente com `React.memo`

**Quando NÃO usar:**
- Cálculos simples — o overhead do `useMemo` é maior que o ganho
- Sem problema de performance identificado — otimização prematura

---

## React.lazy + Suspense — code splitting

Componentes pesados só são carregados quando o usuário realmente precisa deles — reduz o bundle inicial.

```javascript
import { lazy, Suspense } from 'react';

const HeavyDashboard = lazy(() => import('./HeavyDashboard'));

function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <div>
      <button onClick={() => setShowDashboard(true)}>
        Abrir Dashboard
      </button>

      {showDashboard && (
        <Suspense fallback={<p>Carregando...</p>}>
          <HeavyDashboard /> {/* JS só é baixado quando necessário */}
        </Suspense>
      )}
    </div>
  );
}
```

**Por que importa:** reduz o tempo de carregamento inicial da aplicação, impactando diretamente a experiência do usuário e métricas de SEO como Core Web Vitals.

---

## A regra mais importante — não otimize antes de ter o problema

`React.memo`, `useCallback` e `useMemo` têm custo:
- Memória para guardar o valor anterior
- Custo de comparação a cada render
- Complexidade de código

Aplicar em todo lugar sem medir pode deixar a aplicação mais lenta, não mais rápida.

**O fluxo correto:**

```
1. Percebe lentidão real — usuário reclama ou você mede
2. Usa React DevTools Profiler para identificar o componente problemático
3. Aplica a otimização cirúrgica naquele componente específico
4. Mede de novo para confirmar a melhora
```

---

## Perguntas de entrevista — respostas modelo

**"Quando você usaria React.memo?"**
> "Quando tenho um componente filho computacionalmente caro cujas props raramente mudam, mas o pai re-renderiza com frequência. Mas sempre meço primeiro com React DevTools Profiler — otimização prematura tem custo de legibilidade e memória."

**"Qual a relação entre React.memo e useCallback?"**
> "React.memo evita re-render quando as props não mudam. Mas se uma prop é uma função, ela tem referência nova a cada render do pai — o memo não funciona. useCallback mantém a mesma referência da função enquanto suas dependências não mudam. Os dois precisam ser usados juntos quando há funções como props."

**"Quando useCallback faz sentido sem React.memo?"**
> "Quando a função é usada como dependência de useEffect. Sem useCallback, a função tem referência nova em todo render, o useEffect detecta mudança, roda de novo, causa re-render, nova referência — loop infinito."

**"O que é code splitting e por que importa?"**
> "É dividir o bundle JavaScript em partes menores carregadas sob demanda. Com React.lazy e Suspense, componentes pesados só são baixados quando necessários — reduz o tempo de carregamento inicial e impacta métricas como Core Web Vitals."
