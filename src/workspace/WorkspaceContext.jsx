import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { WorkspaceContext } from './workspaceContext'

export function WorkspaceProvider({ children }) {
  const { user, role } = useAuth()
  const [customers, setCustomers] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCustomers() {
      if (role !== 'admin') {
        setCustomers([])
        setSelectedCustomerId(user?.id ?? null)
        setError('')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      const { data, error: customersError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'customer')
        .order('full_name')

      if (customersError) {
        setCustomers([])
        setSelectedCustomerId(null)
        setError(customersError.message)
      } else {
        const savedCustomerId = sessionStorage.getItem('activeCustomerId')
        const savedCustomerExists = data.some(
          (customer) => customer.id === savedCustomerId,
        )

        setCustomers(data)
        setSelectedCustomerId(savedCustomerExists ? savedCustomerId : null)
      }

      setLoading(false)
    }

    loadCustomers()
  }, [role, user?.id])

  function selectCustomer(customerId) {
    const nextCustomerId = customerId || null
    setSelectedCustomerId(nextCustomerId)

    if (nextCustomerId) {
      sessionStorage.setItem('activeCustomerId', nextCustomerId)
    } else {
      sessionStorage.removeItem('activeCustomerId')
    }
  }

  const workspaceCustomerId =
    role === 'admin' ? selectedCustomerId : user?.id ?? null
  const selectedCustomer =
    customers.find((customer) => customer.id === selectedCustomerId) ?? null

  const value = useMemo(
    () => ({
      customers,
      selectedCustomer,
      selectedCustomerId,
      workspaceCustomerId,
      selectCustomer,
      loading,
      error,
    }),
    [customers, selectedCustomer, selectedCustomerId, workspaceCustomerId, loading, error],
  )

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}
