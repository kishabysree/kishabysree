const bagStorageKey = 'kishabysree-bag';

export function loadSessionBag() {
  try {
    const stored = window.sessionStorage.getItem(bagStorageKey);
    if (stored === null) return { items: [], error: '' };
    const items = JSON.parse(stored);
    if (!Array.isArray(items) || items.some(item =>
      !item || typeof item.id !== 'string' || typeof item.name !== 'string' ||
      typeof item.price !== 'string' || typeof item.color !== 'string' ||
      (item.size !== undefined && typeof item.size !== 'string') ||
      !Number.isSafeInteger(item.quantity) || item.quantity < 1
    )) {
      throw new Error('Stored bag data is invalid.');
    }
    return { items, error: '' };
  } catch (error) {
    console.error('Could not restore the shopping bag from session storage:', error);
    return { items: [], error: 'Your saved bag could not be restored.' };
  }
}

export function saveSessionBag(items) {
  try {
    window.sessionStorage.setItem(bagStorageKey, JSON.stringify(items));
    return true;
  } catch (error) {
    console.error('Could not save the shopping bag to session storage:', error);
    return false;
  }
}

function matchesItem(item, id, size) {
  return item.id === id && item.size === size;
}

export function addBagItem(items, product, size) {
  if (items.some(item => matchesItem(item, product.id, size))) {
    return changeBagQuantity(items, product.id, size, 1);
  }
  return [...items, { id: product.id, name: product.name, price: product.price, color: product.color, size, quantity: 1 }];
}

export function changeBagQuantity(items, id, size, change) {
  return items.flatMap(item => {
    if (!matchesItem(item, id, size)) return [item];
    const quantity = item.quantity + change;
    return quantity > 0 ? [{ ...item, quantity }] : [];
  });
}

export function removeBagItem(items, id, size) {
  return items.filter(item => !matchesItem(item, id, size));
}
