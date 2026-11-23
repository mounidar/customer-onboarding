import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

const STATUSES = ['New', 'Kickoff', 'Implementation', 'Live'] as const
type Status = (typeof STATUSES)[number]

type Customer = {
  id: number
  name: string
  email: string
  status: Status
  createdAt: string
}

function App() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  useEffect(() => {
    async function loadCustomers() {
      try {
        const response = await fetch('/api/customers')

        if (!response.ok) {
          throw new Error('Could not load customers.')
        }

        const data: Customer[] = await response.json()
        setCustomers(data)
      } catch {
        setError('Could not load customers. Check that the .NET API is running.')
      }
    }

    void loadCustomers()
  }, [])

  async function addCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })

      if (!response.ok) {
        throw new Error('Could not add customer.')
      }

      const created: Customer = await response.json()
      setCustomers((current) => [...current, created])
      setName('')
      setEmail('')
    } catch {
      setError('Could not add customer. Check the API and try again.')
    }
  }
  async function updateStatus(customer: Customer, status: Status) {
    setError('')

    try {
      const response = await fetch(`/api/customers/${customer.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Could not update status.')
      }

      const updated: Customer = await response.json()
      setCustomers((current) =>
        current.map((c) => (c.id === updated.id ? updated : c))
      )
      setSelectedCustomer(updated)
    } catch {
      setError('Could not update the status. Check the API and try again.')
    }
  }

  const visibleCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase().trim())
  )
  return (
    <main>
      <h1>Customer onboarding</h1>
      <p>Manage the customers beginning their implementation.</p>

      <form onSubmit={addCustomer}>
        <label>
          Company name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        <label>
          Contact email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <button type="submit">Add customer</button>
      </form>

      {error && <p role="alert">{error}</p>}
      <label>
       Search companies
       <input
    value={search}
    onChange={(event) => setSearch(event.target.value)}
    placeholder="Type a company name"
        />
      </label>
      <h2>Customers</h2>
      {visibleCustomers.length === 0 ? (
        <p>No customers yet.</p>
      ) : (
        <ul>
          {visibleCustomers.map((customer) => (
            <li key={customer.id}>
              <button
               type="button"
               onClick={() => setSelectedCustomer(customer)}
              >
               {customer.name}
              </button>
              {' — '}
              {customer.email}{' '}
              <span className={`status status-${customer.status.toLowerCase()}`}>
                {customer.status}
              </span>
            </li>
          ))}
        </ul>
      )}
     {selectedCustomer && (
       <section>
        <h2>{selectedCustomer.name}</h2>
        <p>Customer ID: {selectedCustomer.id}</p>
        <p>Contact: {selectedCustomer.email}</p>
        <p>
          Added: {new Date(selectedCustomer.createdAt).toLocaleDateString()}
        </p>
        <label>
          Onboarding status
          <select
            value={selectedCustomer.status}
            onChange={(event) =>
              void updateStatus(selectedCustomer, event.target.value as Status)
            }
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setSelectedCustomer(null)}
        >
          Close details
        </button>
       </section>
    )}
    </main>
  )
}

export default App