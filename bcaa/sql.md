# SQL — Performance e Boas Práticas

## Como otimizar uma query lenta — o processo completo

Nunca otimize no escuro. O processo correto:

```
1. EXPLAIN ANALYZE — entenda o que o banco está fazendo
2. Identifique o gargalo — full scan, índice faltando, N+1, JOIN desnecessário
3. Aplique a otimização
4. Meça novamente para confirmar a melhora
```

**A resposta para entrevista:**
> "Para otimizar uma query lenta, começo com EXPLAIN ANALYZE para entender o que o banco está fazendo — se há full table scan, quantas linhas está percorrendo. A causa mais comum é ausência de índice nas colunas de WHERE, JOIN ou ORDER BY. Verifico também se estamos fazendo SELECT * quando só precisamos de algumas colunas, se há JOINs desnecessários, e se há problema de N+1. Em paginação, evito OFFSET alto em tabelas grandes — prefiro cursor pagination com ID. E sempre meço antes e depois para confirmar que a otimização teve efeito."

---

## 1. Índices

### O que é

Estrutura auxiliar que o banco mantém para acelerar buscas. Funciona como o índice de um livro — em vez de percorrer todas as páginas, você vai direto onde precisa.

Sem índice: **O(n)** — full table scan
Com índice: **O(log n)** — busca na B-Tree

### Criando índices

```sql
-- Índice simples
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

-- Índice único — garante que não há duplicatas
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Índice composto — para queries que filtram por múltiplas colunas
CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);

-- Removendo índice
DROP INDEX idx_orders_customer_id;
```

### Verificando se o índice está sendo usado

```sql
-- PostgreSQL
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123;

-- Sem índice — lento
Seq Scan on orders  (cost=0.00..180000.00 rows=50 width=100)
  Filter: (customer_id = 123)

-- Com índice — rápido
Index Scan using idx_orders_customer_id on orders  (cost=0.43..8.45 rows=50)
  Index Cond: (customer_id = 123)
```

`Seq Scan` = full table scan = sem índice = lento
`Index Scan` = usando índice = rápido

### O custo dos índices — o trade-off

O banco não recria a B-Tree inteira — atualiza incrementalmente a posição do registro:

```
INSERT → encontra posição correta na B-Tree → insere lá
UPDATE → remove da posição antiga → insere na nova posição
DELETE → remove a entrada da B-Tree
```

| | Sem índice | Com índice |
|---|---|---|
| SELECT | Lento — full scan | Rápido — O(log n) |
| INSERT | Rápido | Mais lento |
| UPDATE | Rápido | Mais lento |
| DELETE | Rápido | Mais lento |
| Espaço em disco | Menos | Mais |

**O trade-off é aceitável** — consultas são muito mais frequentes que escritas na maioria dos sistemas.

### Quando NÃO criar índice

```sql
-- Colunas com poucos valores distintos — índice pouco eficiente
CREATE INDEX idx_orders_status ON orders(status); -- só 3 valores

-- Tabelas pequenas — full scan é mais rápido
CREATE INDEX idx_config_key ON config(key); -- desnecessário

-- Colunas com muitos updates — custo alto de manutenção
CREATE INDEX idx_sessions_last_active ON sessions(last_active);
```

### Índice composto — a ordem importa

```sql
CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);

-- USA o índice — customer_id é o primeiro campo
SELECT * FROM orders WHERE customer_id = 123;
SELECT * FROM orders WHERE customer_id = 123 AND status = 'pending';

-- NÃO USA o índice — status sozinho não é o primeiro campo
SELECT * FROM orders WHERE status = 'pending';
```

A regra: o índice composto só funciona se a query incluir o **primeiro campo** do índice.

---

## 2. N+1 Queries

### O problema

1 query para buscar uma lista + N queries para dados relacionados de cada item:

```javascript
// 1 query para orders
const orders = await db.query('SELECT * FROM orders LIMIT 50');

// N queries — uma para cada pedido
for (const order of orders) {
  const customer = await db.query(
    'SELECT * FROM customers WHERE id = ?',
    [order.customer_id]
  );
  order.customer = customer;
}

// Total: 51 queries para 50 pedidos
// Com 1000 pedidos: 1001 queries
```

Acontece principalmente dentro de loops e em ORMs com lazy loading implícito.

### Solução 1 — JOIN

```sql
-- 1 única query que traz tudo
SELECT
  o.id,
  o.status,
  o.total,
  c.name AS customer_name,
  c.email AS customer_email
FROM orders o
JOIN customers c ON c.id = o.customer_id
LIMIT 50;
```

### Solução 2 — IN clause

Quando o JOIN fica muito complexo:

```javascript
// 1 — busca os pedidos
const orders = await db.query('SELECT * FROM orders LIMIT 50');

// 2 — coleta IDs únicos
const customerIds = [...new Set(orders.map(o => o.customer_id))];

// 3 — 1 query para todos os clientes
const customers = await db.query(
  'SELECT * FROM customers WHERE id IN (?)',
  [customerIds]
);

// 4 — mapeia em memória
const customerMap = Object.fromEntries(customers.map(c => [c.id, c]));
orders.forEach(order => {
  order.customer = customerMap[order.customer_id];
});

// Total: 2 queries em vez de N+1
```

### N+1 em ORMs — eager loading

```typescript
// Prisma — N+1 com lazy loading
const orders = await prisma.order.findMany();
for (const order of orders) {
  const customer = await prisma.customer.findUnique({
    where: { id: order.customerId }
  });
}

// Correto — eager loading com include
const orders = await prisma.order.findMany({
  include: {
    customer: true // faz JOIN automaticamente
  }
});
```

### Como identificar N+1 em produção

- **Datadog / New Relic** — muitas queries por request sugere N+1
- **Logs do banco** — slow query log e query log
- **EXPLAIN ANALYZE** — analisa queries específicas

---

## 3. Tipos de JOIN

```sql
-- Dados de exemplo
-- orders: 1(customer_id=1), 2(customer_id=2), 3(customer_id=999)
-- customers: id=1(Ana), id=2(Bruno)
```

**INNER JOIN — só retorna quando há match nos dois lados:**

```sql
SELECT o.id, c.name
FROM orders o
INNER JOIN customers c ON c.id = o.customer_id;

-- Resultado: pedido 1(Ana), pedido 2(Bruno)
-- pedido 3 NÃO aparece — customer_id=999 não existe
```

**LEFT JOIN — retorna todos da esquerda, match ou não:**

```sql
SELECT o.id, c.name
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id;

-- Resultado: pedido 1(Ana), pedido 2(Bruno), pedido 3(NULL)
-- pedido 3 aparece com customer NULL
```

**RIGHT JOIN — retorna todos da direita:**

```sql
-- Na prática RIGHT JOIN é raro
-- Prefira inverter as tabelas e usar LEFT JOIN
```

---

## 4. Outras otimizações

**SELECT só o que precisa:**

```sql
-- RUIM
SELECT * FROM orders WHERE customer_id = 123;

-- BOM
SELECT id, status, total, created_at FROM orders WHERE customer_id = 123;
```

**Paginação correta:**

```sql
-- RUIM — percorre 10020 linhas para retornar 20
SELECT * FROM orders LIMIT 20 OFFSET 10000;

-- BOM — cursor pagination com índice
SELECT * FROM orders WHERE id > 10000 ORDER BY id LIMIT 20;
```

**Validação de input — nunca concatene valores na query:**

```sql
-- VULNERÁVEL — SQL injection
SELECT * FROM orders WHERE id = ' + req.params.id + ';

-- SEGURO — parâmetros separados
SELECT * FROM orders WHERE id = ?  -- MySQL
SELECT * FROM orders WHERE id = $1 -- PostgreSQL
```

---

## Perguntas de entrevista — respostas modelo

**"Como você otimizaria uma query lenta?"**
> "Começo com EXPLAIN ANALYZE para entender o que o banco está fazendo — se há full table scan, quantas linhas está percorrendo. A causa mais comum é ausência de índice nas colunas de WHERE, JOIN ou ORDER BY. Verifico também SELECT *, JOINs desnecessários e N+1. E sempre meço antes e depois para confirmar a melhora."

**"O que é um índice e quando você criaria um?"**
> "Um índice é uma estrutura auxiliar que acelera buscas — funciona como o índice de um livro. Crio nas colunas usadas frequentemente em WHERE, JOIN e ORDER BY. Mas índices têm custo em INSERT, UPDATE e DELETE — então evito em colunas com poucos valores distintos, tabelas pequenas, ou colunas com muitos updates."

**"Qual a diferença entre INNER JOIN e LEFT JOIN?"**
> "INNER JOIN retorna apenas registros que têm match nos dois lados. LEFT JOIN retorna todos os registros da tabela da esquerda — com NULL nos campos da direita quando não há match. Uso LEFT JOIN quando quero incluir registros que podem não ter relacionamento — como pedidos sem cliente associado."

**"O que é N+1 e como você resolve?"**
> "N+1 é quando você faz 1 query para buscar uma lista e N queries adicionais para dados relacionados de cada item — geralmente dentro de um loop. Com 50 pedidos você faz 51 queries, com 1000 pedidos faz 1001. A solução mais comum é JOIN — buscar tudo em uma única query. Quando o JOIN fica complexo, uso IN clause para buscar todos os relacionados de uma vez e mapeio em memória. Em ORMs uso eager loading com include para evitar lazy loading implícito."
