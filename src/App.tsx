import { useState, useEffect } from "react";
import { 
  FolderOpen, Plus, Tag, DollarSign, Edit3, Trash2, Image as ImageIcon,
  Check, X, RefreshCw, Layers, ExternalLink, Sparkles
} from "lucide-react";
import { FileMetadata } from "./types";
import FileManager from "./components/FileManager";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  description: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"products" | "vault">("products");
  const [products, setProducts] = useState<Product[]>([
    {
      id: "prod-1",
      name: "Ultra Wireless Gaming Headphones",
      price: 129.99,
      category: "Electronics",
      imageUrl: "", // empty so they can upload or pick one
      description: "High-fidelity sound, active noise canceling, 40-hour battery life."
    },
    {
      id: "prod-2",
      name: "Ergonomic Office Mesh Chair",
      price: 249.50,
      category: "Furniture",
      imageUrl: "",
      description: "Breathable mesh back, adjustable lumbar support, 3D armrests."
    }
  ]);

  // Product CRUD / Edit states
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("Electronics");
  const [productDescription, setProductDescription] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");

  // Vault modal selection states
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [activeProductTarget, setActiveProductTarget] = useState<"new" | "edit" | null>(null);

  const startAddProduct = () => {
    setProductName("");
    setProductPrice("");
    setProductCategory("Electronics");
    setProductDescription("");
    setProductImageUrl("");
    setActiveProductTarget("new");
    setIsAddingProduct(true);
  };

  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductName(prod.name);
    setProductPrice(prod.price.toString());
    setProductCategory(prod.category);
    setProductDescription(prod.description);
    setProductImageUrl(prod.imageUrl);
    setActiveProductTarget("edit");
  };

  const saveProduct = () => {
    if (!productName.trim() || !productPrice.trim()) return;

    if (activeProductTarget === "new") {
      const newProd: Product = {
        id: "prod-" + Math.random().toString(36).substring(2, 9),
        name: productName,
        price: parseFloat(productPrice) || 0,
        category: productCategory,
        description: productDescription,
        imageUrl: productImageUrl
      };
      setProducts([...products, newProd]);
      setIsAddingProduct(false);
    } else if (activeProductTarget === "edit" && editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? {
        ...p,
        name: productName,
        price: parseFloat(productPrice) || 0,
        category: productCategory,
        description: productDescription,
        imageUrl: productImageUrl
      } : p));
      setEditingProduct(null);
    }
    setActiveProductTarget(null);
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // Callback when user picks a file from our Vault Modal
  const handleSelectFileFromModal = (file: FileMetadata) => {
    const fileUrl = `/uploads/${file.filename}`;
    setProductImageUrl(fileUrl);
    setIsVaultModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-xl text-white shadow-lg shadow-indigo-500/10">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                Vercel Integrated System
              </h1>
              <p className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest mt-0.5">
                Product Manager & File Storage Vault
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Tab Toggles */}
            <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 flex space-x-1">
              <button
                onClick={() => setActiveTab("products")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === "products"
                    ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Product Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab("vault")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === "vault"
                    ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span>Storage Vault</span>
              </button>
            </div>

            <div className="hidden sm:flex text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 items-center space-x-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>CORS Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: PRODUCT MANAGER */}
        {activeTab === "products" && (
          <div className="space-y-6">
            
            {/* Info Notice card explaining Vercel Integration */}
            <div className="bg-slate-900/60 border border-indigo-500/15 rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                  How To Deploy On Vercel
                </span>
                <h3 className="font-bold text-slate-100 text-base">Perfect Vercel & GitHub Connectivity</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Our file upload server is fully live and configured with <span className="text-indigo-400 font-semibold">CORS headers</span>. 
                  You can deploy your frontend on Vercel, push to GitHub, and integrate our unified <span className="text-emerald-400 font-semibold">FileManager.tsx</span> modal. 
                  Just copy the files from this project into your Vercel workspace!
                </p>
              </div>
              <div className="shrink-0 flex space-x-3">
                <a
                  href="/api/files"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 rounded-xl text-xs font-semibold flex items-center space-x-2"
                >
                  <span>Test API Endpoint</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Dashboard Header controls */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-900">
              <div>
                <h2 className="text-lg font-extrabold text-slate-100">Catalog Inventory</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage stock details and assign storage-backed asset links</p>
              </div>
              <button
                onClick={startAddProduct}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Add Custom Product</span>
              </button>
            </div>

            {/* Main Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(prod => (
                <div key={prod.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-slate-950 flex items-center justify-center border-b border-slate-800/50 overflow-hidden relative">
                    {prod.imageUrl ? (
                      <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">No Asset Assigned</span>
                      </div>
                    )}
                    {/* Price tag */}
                    <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-slate-900/90 text-xs font-bold text-emerald-400 border border-slate-800 backdrop-blur-sm shadow-md">
                      ${prod.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Body details */}
                  <div className="p-5 space-y-3 flex-grow flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-[10px] font-bold text-slate-400 border border-slate-800 uppercase tracking-wider">
                          {prod.category}
                        </span>
                        <span className="text-[9px] text-slate-600 font-mono">{prod.id}</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-100 line-clamp-1">{prod.name}</h3>
                      <p className="text-xs text-slate-400 font-normal line-clamp-2 min-h-8 leading-relaxed">
                        {prod.description}
                      </p>
                    </div>

                    {/* Footer Controls */}
                    <div className="pt-4 border-t border-slate-800/60 flex items-center justify-end space-x-2">
                      <button
                        onClick={() => startEditProduct(prod)}
                        className="p-1.5 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 rounded-lg border border-transparent hover:border-indigo-500/20 transition-all"
                        title="Edit Details"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteProduct(prod.id)}
                        className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg border border-transparent hover:border-rose-500/20 transition-all"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add / Edit Form Modal Dialog */}
            {(isAddingProduct || editingProduct) && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-slate-100">
                      {isAddingProduct ? "Add New Product" : "Edit Product details"}
                    </h3>
                    <button 
                      onClick={() => {
                        setIsAddingProduct(false);
                        setEditingProduct(null);
                        setActiveProductTarget(null);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Product Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Mechanical Ergonomic Keyboard"
                        value={productName}
                        onChange={e => setProductName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Price ($)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={productPrice}
                          onChange={e => setProductPrice(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category</label>
                        <select
                          value={productCategory}
                          onChange={e => setProductCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Electronics">Electronics</option>
                          <option value="Furniture">Furniture</option>
                          <option value="Clothing">Clothing</option>
                          <option value="Books">Books</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Product Description</label>
                      <textarea
                        rows={3}
                        placeholder="Write dynamic product specifications..."
                        value={productDescription}
                        onChange={e => setProductDescription(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>

                    {/* Image Selector integrated with the FileManager Modal! */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Product Display Image</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Select an image from the storage vault..."
                          value={productImageUrl}
                          onChange={e => setProductImageUrl(e.target.value)}
                          className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setIsVaultModalOpen(true)}
                          className="px-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
                        >
                          Browse Vault
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Tip: Click "Browse Vault" to open the File Manager modal and assign images directly!
                      </p>
                    </div>
                  </div>

                  {/* Form actions */}
                  <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end space-x-3">
                    <button
                      onClick={() => {
                        setIsAddingProduct(false);
                        setEditingProduct(null);
                        setActiveProductTarget(null);
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProduct}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-emerald-500/10"
                    >
                      Save Product
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STORAGE VAULT */}
        {activeTab === "vault" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-900">
              <div>
                <h2 className="text-lg font-extrabold text-slate-100">Live Storage Vault</h2>
                <p className="text-xs text-slate-500 mt-0.5">Direct disk upload workspace configured with JSON indexing database</p>
              </div>
            </div>
            <FileManager />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-600 font-medium tracking-wide">
          <p>© 2026 Storage Vault. Active offline-first persistence with JSON storage.</p>
        </div>
      </footer>

      {/* The Vault Selection Modal integration! */}
      {isVaultModalOpen && (
        <FileManager 
          isModalMode={true} 
          allowedCategories={["image"]}
          onSelectFile={handleSelectFileFromModal}
          onClose={() => setIsVaultModalOpen(false)}
        />
      )}
    </div>
  );
}
