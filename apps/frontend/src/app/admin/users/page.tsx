'use client'

import { useEffect, useState, useMemo } from 'react'
import { Eye, Search, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'

type User = {
  id: number
  email: string
  role: string
  createdAt: string
}

type SortField = 'id' | 'email' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const data = await api.get<{ users: User[] }>('/api/users')
      setUsers(data.users || [])
    } catch (e) {
      console.error('Failed to fetch users:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              user.id.toString().includes(searchQuery)
        const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
        return matchesSearch && matchesRole
      })
      .sort((a, b) => {
        let valA = a[sortField]
        let valB = b[sortField]
        
        if (sortField === 'createdAt') {
          valA = new Date(valA).getTime() as any
          valB = new Date(valB).getTime() as any
        }
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
  }, [users, searchQuery, roleFilter, sortField, sortDirection])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-zinc-400" />
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 text-indigo-600" /> : <ArrowDown className="w-4 h-4 text-indigo-600" />
  }

  if (loading) return <div className="animate-pulse text-zinc-500">Loading users...</div>

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-zinc-900">Registered Users</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search email or ID..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full sm:w-64 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
            
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <select 
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="pl-9 pr-8 py-2 w-full sm:w-40 bg-zinc-50 border border-zinc-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-sm border-b border-zinc-200">
                <th className="px-6 py-4 font-medium">
                  <button onClick={() => handleSort('id')} className="flex items-center gap-2 hover:text-zinc-900 transition-colors">
                    ID <SortIcon field="id" />
                  </button>
                </th>
                <th className="px-6 py-4 font-medium">
                  <button onClick={() => handleSort('email')} className="flex items-center gap-2 hover:text-zinc-900 transition-colors">
                    Email <SortIcon field="email" />
                  </button>
                </th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">
                  <button onClick={() => handleSort('createdAt')} className="flex items-center gap-2 hover:text-zinc-900 transition-colors">
                    Joined Date <SortIcon field="createdAt" />
                  </button>
                </th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm">
              {filteredAndSortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredAndSortedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900">#{user.id}</td>
                    <td className="px-6 py-4 text-zinc-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        user.role === 'ADMIN' 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/users/${user.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" /> Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
