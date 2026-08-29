export default function ProductCard({ product, actions }) {
  return (
    <div className="product-card">
      <div className="product-image">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <span className="placeholder">No image</span>
        )}
      </div>
      <div className="product-body">
        <span className="product-category">{product.category}</span>
        <span className="product-name">{product.name}</span>
        {product.seller_name && <span className="product-seller">Sold by {product.seller_name}</span>}
        <span className="product-price">₹{Number(product.price).toFixed(2)}</span>
      </div>
      {actions && <div className="product-actions">{actions}</div>}
    </div>
  );
}
