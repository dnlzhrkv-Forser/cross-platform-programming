// Автоматична перевірка GraphQL API (пункти 11.1–11.5). Сервер має працювати: npm run dev
const URL = process.env.GRAPHQL_URL || `http://localhost:${process.env.GRAPHQL_PORT || 4001}/`;

let passed = 0;
let failed = 0;
let skipped = 0;

async function gql(query, token) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

function check(name, condition) {
  if (condition) {
    passed++;
    console.log(`  ✔ ${name}`);
  } else {
    failed++;
    console.log(`  ✘ ${name}`);
  }
}

const code = (r) => r.errors?.[0]?.extensions?.code;
const email = `check${Date.now()}@example.com`;

try {
  console.log('Автентифікація (11.1–11.3)');
  const reg = await gql(`mutation { register(name: "Тест", email: "${email}", password: "123456") { token user { id name email } } }`);
  check('register повертає token і user', Boolean(reg.data?.register?.token) && reg.data.register.user.email === email);
  const token = reg.data?.register?.token;

  const dup = await gql(`mutation { register(name: "Тест", email: "${email}", password: "123456") { token } }`);
  check('повторна реєстрація з тим самим email — помилка', code(dup) === 'BAD_USER_INPUT');

  const login = await gql(`mutation { login(email: "${email}", password: "123456") { token user { id } } }`);
  check('login повертає token повторно', Boolean(login.data?.login?.token));

  const bad = await gql(`mutation { login(email: "${email}", password: "wrong") { token } }`);
  check('login з неправильним паролем — UNAUTHENTICATED', code(bad) === 'UNAUTHENTICATED');

  const me = await gql('query { me { id name email } }', token);
  check('me з токеном повертає користувача', me.data?.me?.email === email);

  const meAnon = await gql('query { me { id } }');
  check('me без токена повертає null', meAnon.data?.me === null);

  const users = await gql('query { users { id name email } }');
  const noHash = await gql('query { users { passwordHash } }');
  check('у схемі User немає поля passwordHash', Boolean(noHash.errors));

  console.log('Захист операцій (11.5)');
  const create = (t) =>
    gql('mutation { createMedicine(name: "Парацетамол 500 мг", category: "Жарознижувальні", manufacturer: "Дарниця", price: 45.5) { id owner { id } } }', t);
  const noAuth = await create();
  check('createMedicine без токена — «Потрібна авторизація.»', code(noAuth) === 'UNAUTHENTICATED' && noAuth.errors[0].message === 'Потрібна авторизація.');
  const badAuth = await create('bad.token.value');
  check('createMedicine з хибним токеном — «Потрібна авторизація.»', code(badAuth) === 'UNAUTHENTICATED');
  const upd = await gql('mutation { updateMedicine(id: "000000000000000000000000", name: "X", category: "X", manufacturer: "X", price: 1) { id } }');
  check('updateMedicine без токена — помилка', code(upd) === 'UNAUTHENTICATED');
  const del = await gql('mutation { deleteMedicine(id: "000000000000000000000000") }');
  check('deleteMedicine без токена — помилка', code(del) === 'UNAUTHENTICATED');
  const ord = await gql('query { orders { id } }');
  check('orders без токена — помилка', code(ord) === 'UNAUTHENTICATED');

  console.log('Операції з MongoDB (11.4)');
  const probe = await gql('query { medicines { id } }');
  if (code(probe) === 'DB_UNAVAILABLE') {
    skipped = 8;
    console.log('  – MongoDB недоступна: перевірки з базою пропущено (перевірте MONGO_URI у .env)');
  } else {
    const created = await create(token);
    const medId = created.data?.createMedicine?.id;
    check('createMedicine з токеном створює запис', Boolean(medId));
    check('owner береться з токена', created.data?.createMedicine?.owner?.id === reg.data.register.user.id);

    const list = await gql('query { medicines { id name owner { name } } }');
    check('medicines повертає препарати з бази', Array.isArray(list.data?.medicines) && list.data.medicines.length > 0);

    const one = await gql(`query { medicine(id: "${medId}") { id name } }`);
    check('medicine(id) повертає препарат', one.data?.medicine?.id === medId);

    const updated = await gql(`mutation { updateMedicine(id: "${medId}", name: "Парацетамол 500 мг", category: "Жарознижувальні", manufacturer: "Дарниця", price: 52) { price } }`, token);
    check('updateMedicine з токеном змінює ціну', updated.data?.updateMedicine?.price === 52);

    const invalid = await gql('mutation { createMedicine(name: "", category: "Вітаміни", manufacturer: "Solgar", price: 10) { id } }', token);
    check('порожня назва — BAD_USER_INPUT', code(invalid) === 'BAD_USER_INPUT');

    const order = await gql(`mutation { createOrder(name: "Тест", phone: "+380501234567", address: "Київ", items: [{ id: "${medId}", qty: 2 }]) { total items { qty } } }`);
    check('createOrder рахує суму за цінами з бази', order.data?.createOrder?.total === 104);

    const removed = await gql(`mutation { deleteMedicine(id: "${medId}") }`, token);
    check('deleteMedicine з токеном повертає true', removed.data?.deleteMedicine === true);
  }
} catch (err) {
  failed++;
  console.error('Не вдалося звернутися до сервера:', err.message);
  console.error(`Запустіть сервер (npm run dev) і перевірте адресу ${URL}`);
}

console.log(`\nУспішно: ${passed}, помилок: ${failed}${skipped ? `, пропущено: ${skipped}` : ''}`);
process.exit(failed ? 1 : 0);
