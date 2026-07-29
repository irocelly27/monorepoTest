'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, X } from 'lucide-react'
import { api } from '@/lib/api'

type Product = {
  id: number
  name: string
  description: string
  price: number
  imageUrl: string
  tag: string
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [productModal, setProductModal] = useState<{ isOpen: boolean, product?: Product | null }>({ isOpen: false })
  const [prodForm, setProdForm] = useState({ name: '', description: '', price: 0, tag: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [prodSaving, setProdSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const data = await api.get<Product[]>('/api/products')
      setProducts(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openProductModal = (prod?: Product) => {
    if (prod) {
      setProdForm({ 
        name: prod.name, 
        description: prod.description || '', 
        price: prod.price / 100, // form works in dollars
        tag: prod.tag || '' 
      })
    } else {
      setProdForm({ name: '', description: '', price: 0, tag: '' })
    }
    setImageFile(null)
    setProductModal({ isOpen: true, product: prod })
  }

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setProdSaving(true)
    setToastMessage(null)
    const token = localStorage.getItem('token')
    
    const formData = new FormData()
    formData.append('name', prodForm.name)
    formData.append('description', prodForm.description)
    formData.append('price', Math.round(prodForm.price * 100).toString()) // convert back to cents
    formData.append('tag', prodForm.tag)
    
    if (imageFile) {
      formData.append('image', imageFile)
    }

    try {
      const url = productModal.product ? `/api/products/${productModal.product.id}` : `/api/products`
      
      if (productModal.product) {
        await api.put(url, formData)
      } else {
        await api.post(url, formData)
      }
      
      await fetchData()
      setProductModal({ isOpen: false })
      setToastMessage({ text: productModal.product ? 'Product updated successfully' : 'Product added successfully', type: 'success' })
      setTimeout(() => setToastMessage(null), 3000)
    } catch (err) {
      console.error(err)
      setToastMessage({ text: (err as Error).message || 'Failed to save product', type: 'error' })
      setTimeout(() => setToastMessage(null), 3000)
    } finally {
      setProdSaving(false)
    }
  }

  const deleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      await api.delete(`/api/products/${id}`)
      await fetchData()
    } catch (err) {
      alert((err as Error).message || 'Failed to delete')
      console.error(err)
    }
  }

  if (loading) return <div className="animate-pulse text-zinc-500">Loading catalog...</div>

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">Manage Products</h2>
          <button 
            onClick={() => openProductModal()}
            className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-sm border-b border-zinc-200">
                <th className="px-6 py-4 font-medium">Image</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Tag</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No products found.</td>
                </tr>
              ) : (
                products.map(prod => (
                  <tr key={prod.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 bg-zinc-100 rounded overflow-hidden">
                        {prod.imageUrl && <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900">{prod.name}</td>
                    <td className="px-6 py-4 font-medium text-zinc-900">${(prod.price / 100).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {prod.tag && <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold">{prod.tag}</span>}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => openProductModal(prod)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteProduct(prod.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product CRUD Modal */}
      {productModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">{productModal.product ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setProductModal({ isOpen: false })} className="text-zinc-500 hover:text-zinc-900">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={saveProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-1">Product Name</label>
                <input required value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-1">Price ($)</label>
                <input required type="number" step="0.01" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: parseFloat(e.target.value)})} className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-1">Description</label>
                <textarea required value={prodForm.description} onChange={e => setProdForm({...prodForm, description: e.target.value})} className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-1">Product Image</label>
                <div className="flex items-center gap-4">
                  {(imageFile || productModal.product?.imageUrl) && (
                    <img 
                      src={imageFile ? URL.createObjectURL(imageFile) : productModal.product?.imageUrl} 
                      className="w-16 h-16 rounded-lg object-cover border border-zinc-200" 
                    />
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => e.target.files && setImageFile(e.target.files[0])} 
                    className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-1">Tag (e.g. Bestseller)</label>
                <input value={prodForm.tag} onChange={e => setProdForm({...prodForm, tag: e.target.value})} className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setProductModal({ isOpen: false })} className="px-4 py-2 text-zinc-600 font-bold">Cancel</button>
                <button type="submit" disabled={prodSaving} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 disabled:opacity-50">
                  {prodSaving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl font-bold text-white transition-all z-[100] animate-in slide-in-from-bottom-5 ${toastMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toastMessage.text}
        </div>
      )}
    </div>
  )
}
