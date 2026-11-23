export function getCategories(products, field) {
  return [...new Set(products.map(product => product[field]).filter(value => typeof value === 'string' && value.trim()))]
    .sort((left, right) => left.localeCompare(right));
}

export function filterProducts(products, collectiveCategory, productCategory, search = '') {
  const terms = search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return products.filter(product =>
    (!collectiveCategory || product['collective-category'] === collectiveCategory) &&
    (!productCategory || product['product-category'] === productCategory) &&
    terms.every(term => ['name', 'color', 'composition', 'origin', 'collective-category', 'product-category', 'description']
      .some(field => typeof product[field] === 'string' && product[field].toLocaleLowerCase().includes(term)))
  );
}
