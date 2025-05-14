'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import api from '@/lib/axios'
import { useQuery } from '@tanstack/react-query'
import apiEndpoints from '@/lib/apiEndpoints'
import { Button } from '@/components/ui/button'
import { UserModal } from '../ui/user-modal'


type Property = {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  latitude: string;
  longitude: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
};

type UserProperty = {
  userId: number;
  propertyId: number;
  property: Property;
};

type User = {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  role: "SERVICE_MANAGER" | "PROPERTY_MANAGER" | "OWNER";
  status: boolean;
  createdAt: string;
  updatedAt: string;
  isFirstLogin: boolean;
  properties: UserProperty[];
};

type UserTable = {
  name:string;
  phone: string;
  role: "SERVICE_MANAGER" | "PROPERTY_MANAGER" | "OWNER";
  status: string;
  properties:number;
}


const tabs = [
  { label: 'All', value: 'ALL' },
  { value: 'PROPERTY_MANAGER', label: 'Property Manager' },
  { value: 'OWNER', label: 'Owner' },
  { value: 'SERVICE_MANAGER', label: 'Service Provider' }
]

const PER_PAGE = 6

export default function UserListTable() {
  const [activeTab, setActiveTab] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [usersApiData, setUsersApiData] = useState<UserTable[]>([])

  const filteredData = usersApiData.filter((item) => {
    const matchTab = activeTab === 'ALL' || item.role === activeTab
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone.includes(searchQuery)
    return matchTab && matchSearch
  })

  const paginated = filteredData.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
  const totalPages = Math.ceil(filteredData.length / PER_PAGE)

  const fetchUsers = async () => {
    const res = await api.get(apiEndpoints.User.endpoints.getAllUsers.path);
    return res.data.users ?? [];
  };

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  useEffect(() => {

    if(users.length > 0) {
      const apiData = users?.filter((u:User) => u.role === "PROPERTY_MANAGER" || 
      u.role === "OWNER" || 
      u.role === "SERVICE_MANAGER" ).map((user:User) => ({
        name:user.name,
        phone:user.phone,
        role:user.role,
        status: user.status ? 'Active' : 'InActive',
        properties: user.properties.length
      }))

      setUsersApiData(apiData);
    }
  }, [users])

  return (
    <div className="p-6">
        <div className='flex justify-between'>
            {/* Custom Tabs */}
            <div className="flex gap-3 mb-4 text-sm font-semibold text-gray-700">
                {tabs.map((tab) => {
                const count =
                    tab.value === 'ALL'
                    ? usersApiData.length
                    : usersApiData.filter((d) => d.role === tab.value).length
                return (
                    <button
                    key={tab.value}
                    onClick={() => {
                        setActiveTab(tab.value)
                        setCurrentPage(1)
                    }}
                    className={`px-4 py-2 rounded-md border ${
                        activeTab === tab.value
                        ? 'bg-red-100 text-red-600 border-red-400'
                        : ' border-gray-300'
                    }`}
                    >
                    {tab.value === 'ALL' ? 'All' : `${count} ${tab.label}${count > 1 ? 's' : ''}`}
                    </button>
                )
                })}
            </div>

            {/* Search */}
            <div className="mb-4">
                <Input
                placeholder="Search property manager"
                className="w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

      {/* Table */}
      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Phone number</th>
              <th className="p-4">Role</th>
              <th className="p-4">No. of properties</th>
              <th className="p-4">Status</th>
              <th className="p-4">Edit</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-6 text-gray-400">
                  No results found
                </td>
              </tr>
            ) : (
              paginated.map((row, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-4">{row.name}</td>
                  <td className="p-4">{row.phone}</td>
                  <td className="p-4">{row.role}</td>
                  <td className="p-4">{row.properties}</td>
                  <td className="p-4 text-green-600">{row.status}</td>
                  <td className="p-4">
                    <Button 
                      variant="link" 
                      className="text-blue-600 px-0 text-sm"
                      onClick={() => {
                        const user = users.find((u:User) => u.name === row.name && u.phone === row.phone);
                        if (user) {
                          setSelectedUserId(user.id);
                          setIsModalOpen(true);
                        }
                      }}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 rounded border disabled:opacity-50"
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-2 py-1 rounded border ${
                page === currentPage ? 'bg-red-500 text-white' : ''
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 rounded border disabled:opacity-50"
          >
            &gt;
          </button>
        </div>
      )}
      <UserModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        userId={selectedUserId}
      />
    </div>
  )
}
