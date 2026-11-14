import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { addBagItem, changeBagQuantity, loadSessionBag, removeBagItem, saveSessionBag } from './bag.js';

const saree = { id: 'saree', name: 'Saree', price: '₹1,000', color: 'White' };
const shirt = { id: 'shirt', name: 'Shirt', price: '₹500', color: 'Blue' };

test('adding the same product and size increments only that entry', () => {
  let items = addBagItem([], saree, '5.5m');
  items = addBagItem(items, saree, '6m');
  items = addBagItem(items, saree, '5.5m');
  items = addBagItem(addBagItem(items, shirt), shirt);

  assert.deepEqual(items.map(({ id, size, quantity }) => ({ id, size, quantity })), [
    { id: 'saree', size: '5.5m', quantity: 2 },
    { id: 'saree', size: '6m', quantity: 1 },
    { id: 'shirt', size: undefined, quantity: 2 }
  ]);
});

test('quantity changes and removal affect only the selected size', () => {
  let items = addBagItem(addBagItem([], saree, '5.5m'), saree, '6m');
  items = changeBagQuantity(items, 'saree', '5.5m', 1);
  items = changeBagQuantity(items, 'saree', '5.5m', -1);
  assert.deepEqual(items.map(item => item.quantity), [1, 1]);

  const removedByDecrement = changeBagQuantity(items, 'saree', '5.5m', -1);
  assert.deepEqual(removedByDecrement.map(item => item.size), ['6m']);
  assert.deepEqual(removeBagItem(items, 'saree', '6m').map(item => item.size), ['5.5m']);
});

test('session storage restores quantities, sizes, and unsized products', t => {
  const previousWindow = globalThis.window;
  const data = new Map();
  globalThis.window = { sessionStorage: {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value)
  } };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });

  let items = addBagItem([], saree, '5.5m');
  items = addBagItem(items, saree, '5.5m');
  items = addBagItem(items, saree, '6m');
  items = addBagItem(items, shirt);
  assert.equal(saveSessionBag(items), true);
  const restored = loadSessionBag();
  assert.equal(restored.error, '');
  assert.deepEqual(restored.items.map(({ id, size, quantity }) => ({ id, size, quantity })), [
    { id: 'saree', size: '5.5m', quantity: 2 },
    { id: 'saree', size: '6m', quantity: 1 },
    { id: 'shirt', size: undefined, quantity: 1 }
  ]);
  assert.equal(saveSessionBag([]), true);
  assert.deepEqual(loadSessionBag().items, []);
});

test('reports invalid or inaccessible session storage', t => {
  const previousWindow = globalThis.window;
  globalThis.window = { sessionStorage: {
    getItem: () => '{"bad":true}',
    setItem: () => { throw new Error('Storage unavailable'); }
  } };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });
  const errorLog = t.mock.method(console, 'error', () => {});

  assert.match(loadSessionBag().error, /could not be restored/);
  assert.equal(saveSessionBag([]), false);
  assert.equal(errorLog.mock.callCount(), 2);
});
