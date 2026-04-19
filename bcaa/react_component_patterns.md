# React Component Patterns

## Controlled vs Uncontrolled Components

A pergunta central é: **quem é o dono do valor do input — o React ou o DOM?**

---

### Uncontrolled Component — o DOM é o dono

Comportamento padrão do HTML. O input guarda seu próprio valor internamente. Você busca esse valor quando precisar — geralmente no submit.

```javascript
function Form() {
  const inputRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    console.log(inputRef.current.value); // busca o valor na hora do submit
  }

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} defaultValue="" />
      <button type="submit">Enviar</button>
    </form>
  );
}
```

O React não sabe o que está no input a cada keystroke. Ele só busca quando você pede.

---

### Controlled Component — o React é o dono

O valor do input vive no estado do React. A cada keystroke, o estado atualiza e o React re-renderiza o input com o novo valor.

```javascript
function Form() {
  const [name, setName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    console.log(name); // valor já está no estado
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}                            // React controla o valor
        onChange={e => setName(e.target.value)} // atualiza o estado a cada keystroke
      />
      <button type="submit">Enviar</button>
    </form>
  );
}
```

---

### Comparação

| | Uncontrolled | Controlled |
|---|---|---|
| Valor vive em | DOM | Estado do React |
| Como acessa o valor | `ref.current.value` | variável do estado |
| Re-render a cada keystroke | Não | Sim |
| Validação em tempo real | Difícil | Fácil |
| Quando usar | Casos específicos | Padrão |

---

### Quando usar cada um

**Controlled por padrão.** Uncontrolled apenas com razão específica:
- Formulário muito simples sem nenhuma lógica
- Integração com biblioteca externa que gerencia o DOM diretamente
- Problema de performance identificado em formulário muito grande

**Por que controlled é preferido:**

```javascript
function Form() {
  const [email, setEmail] = useState('');
  const isValid = email.includes('@'); // validação instantânea

  return (
    <div>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ borderColor: isValid ? 'green' : 'red' }}
      />
      {!isValid && <p>Email inválido</p>}
      <button disabled={!isValid}>Enviar</button> {/* desabilitado até ser válido */}
    </div>
  );
}
```

Validação em tempo real, desabilitar botão, mascarar input, formatar enquanto digita — tudo natural com controlled.

---

### Formulários em escala — React Hook Form

Para formulários grandes com muitos campos interdependentes, o re-render a cada keystroke pode virar problema. **React Hook Form** resolve isso usando uncontrolled por baixo dos panos com uma API simples:

```javascript
const { register, handleSubmit, formState: { errors } } = useForm();

<input
  {...register('email', {
    required: 'Email obrigatório',
    pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' }
  })}
/>
```

Performance de uncontrolled com DX de controlled.

---

## Custom Hooks

Extrair lógica reutilizável de um componente para uma função.

**Duas condições para criar um custom hook:**
1. A lógica usa outros hooks (`useState`, `useEffect`, etc.)
2. Aparece em mais de um componente — ou é complexa o suficiente para merecer isolamento

**O nome sempre começa com `use`** — não é só convenção, é o que permite ao React aplicar as regras de hooks corretamente.

---

### O problema sem custom hooks

```javascript
// Em OrderList.jsx
const [orders, setOrders] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  let cancelled = false;
  fetch('/api/orders')
    .then(r => r.json())
    .then(data => { if (!cancelled) { setOrders(data); setIsLoading(false); } })
    .catch(err => { if (!cancelled) { setError(err); setIsLoading(false); } });
  return () => { cancelled = true; };
}, []);

// Em UserList.jsx — mesma lógica, endpoint diferente
// ... tudo de novo
```

Código duplicado. Se quiser adicionar retry automático, precisa alterar em todo lugar.

---

### A solução — custom hook

```javascript
// hooks/useFetch.js
function useFetch(url) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) { setData(data); setIsLoading(false); }
      })
      .catch(err => {
        if (!cancelled) { setError(err); setIsLoading(false); }
      });

    return () => { cancelled = true; };
  }, [url]);

  return { data, isLoading, error };
}

// Em qualquer componente — lógica reutilizada
function OrderList() {
  const { data: orders, isLoading, error } = useFetch('/api/orders');

  if (isLoading) return <p>Carregando...</p>;
  if (error) return <p>Erro ao carregar</p>;
  return orders.map(o => <OrderRow key={o.id} order={o} />);
}

function UserList() {
  const { data: users, isLoading, error } = useFetch('/api/users');
  // mesma lógica, zero duplicação
}
```

---

### Exemplos reais — cobrados em entrevista

**useLocalStorage — persiste estado no browser:**

```javascript
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  const setStoredValue = (newValue) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, setStoredValue];
}

// Uso — igual ao useState mas persiste no browser
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

**useDebounce — evita requests a cada keystroke numa busca:**

```javascript
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer); // cleanup — cancela se value mudar antes do delay
  }, [value, delay]);

  return debouncedValue;
}

// Uso
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500); // só atualiza após 500ms parado

  useEffect(() => {
    if (debouncedQuery) fetchResults(debouncedQuery); // request só depois do delay
  }, [debouncedQuery]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

`useDebounce` combina `useState`, `useEffect` com cleanup, e resolve um problema real de performance em buscas — sem instalar nenhuma dependência externa.

---

## Compound Components

Pattern onde componentes filhos só fazem sentido dentro de um componente pai — que coordena o comportamento de todos.

O exemplo mais claro está no próprio HTML:

```html
<select>
  <option value="1">Opção 1</option>
  <option value="2">Opção 2</option>
</select>
```

`option` sozinho não faz sentido. Ele só existe dentro de `select`. Essa é a ideia.

---

### Em React

```javascript
// Uso — API limpa e declarativa
<Tabs>
  <Tabs.List>
    <Tabs.Tab>Pedidos</Tabs.Tab>
    <Tabs.Tab>Perfil</Tabs.Tab>
  </Tabs.List>

  <Tabs.Panel>Conteúdo de Pedidos</Tabs.Panel>
  <Tabs.Panel>Conteúdo de Perfil</Tabs.Panel>
</Tabs>
```

O componente `Tabs` gerencia qual tab está ativa via Context internamente. Os filhos `Tab` e `Panel` consomem esse estado sem o usuário do componente precisar gerenciar nada.

### Implementação básica

```javascript
const TabsContext = createContext();

function Tabs({ children }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <TabsContext.Provider value={{ activeIndex, setActiveIndex }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.Tab = function Tab({ children, index }) {
  const { activeIndex, setActiveIndex } = useContext(TabsContext);
  return (
    <button
      onClick={() => setActiveIndex(index)}
      style={{ fontWeight: activeIndex === index ? 'bold' : 'normal' }}
    >
      {children}
    </button>
  );
};

Tabs.Panel = function Panel({ children, index }) {
  const { activeIndex } = useContext(TabsContext);
  return activeIndex === index ? <div>{children}</div> : null;
};
```

---

### Quando aparece na prática

Você provavelmente já usou sem saber — bibliotecas como **MUI**, **Radix UI** e **Headless UI** são construídas com esse pattern:

```javascript
// MUI — compound components
<Select>
  <MenuItem value="pending">Pendente</MenuItem>
  <MenuItem value="completed">Concluído</MenuItem>
</Select>
```

---

### Quando é relevante saber implementar

É um pattern de **quem constrói bibliotecas de componentes** — design systems, UI libraries. Quem consome essas bibliotecas usa o pattern sem precisar implementá-lo. Para entrevistas fullstack, saber o conceito e reconhecer o pattern é suficiente.

---

## Perguntas de entrevista — respostas modelo

**"Qual a diferença entre controlled e uncontrolled components?"**
> "Em controlled components, o valor do input vive no estado do React — o componente controla o que está no input a cada keystroke. Em uncontrolled, o DOM guarda o valor e você busca via ref quando precisar. Controlled é o padrão porque facilita validação em tempo real e qualquer lógica baseada no valor. Uncontrolled uso apenas em casos específicos como formulários muito simples ou integração com bibliotecas externas."

**"O que é um custom hook e quando você criaria um?"**
> "Um custom hook é uma função que extrai lógica reutilizável que depende de outros hooks. Crio quando a mesma lógica aparece em mais de um componente — como lógica de fetch, debounce, ou persistência no localStorage. O benefício é centralizar a lógica em um lugar só: se precisar alterar o comportamento, altero apenas no hook."

**"Como você evitaria instalar uma dependência para debounce?"**
> "Implementaria um custom hook useDebounce com useState e useEffect. O useEffect guarda um setTimeout com o delay desejado e faz cleanup cancelando o timer se o valor mudar antes do delay terminar. São 10 linhas que eliminam uma dependência externa."
