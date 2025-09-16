import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import Home from './pages/Home'
import PrimerHome from './pages/PrimerHome'
import PrimerPreview from './pages/PrimerPreview'
import AuthCallback from './pages/AuthCallback'

// user dashboard (refactor to multiple pages with sidebar)
import UserLayout from './pages/user/UserLayout'
import Overview from './pages/user/Overview'
import Period from './pages/user/Period'
import Daily from './pages/user/Daily'
import Summary from './pages/user/Summary'
import Overdraft from './pages/user/Overdraft'
import Wallets from './pages/user/Wallets'
import Ledger from './pages/user/Ledger'
import Proxy from './pages/user/Proxy'
import Health from './pages/Health'
import Settings from './pages/Settings'
import Login from './pages/Login'
import AdminLogin from './pages/admin/AdminLogin'
import Purchase from './pages/Purchase'

// admin pages with sidebar
import AdminLayout from './pages/admin/AdminLayout'
import PlanCreate from './pages/admin/PlanCreate'
import PlanDaily from './pages/admin/PlanDaily'
import PlanUsage from './pages/admin/PlanUsage'
import PlanPriceRule from './pages/admin/PlanPriceRule'
import PlanAssign from './pages/admin/PlanAssign'
import PlanDetail from './pages/admin/PlanDetail'
import PriceMappings from './pages/admin/PriceMappings'
import PlansList from './pages/admin/plans/PlansList'
import NewPlanDetail from './pages/admin/plans/PlanDetail'
import Customers from './pages/admin/Customers'
import CustomersList from './pages/admin/customers/CustomersList'
import CustomerDetail from './pages/admin/customers/CustomerDetail'
import Subscriptions from './pages/admin/Subscriptions'
import SubscriptionsList from './pages/admin/subscriptions/SubscriptionsList'
import SubscriptionDetail from './pages/admin/subscriptions/SubscriptionDetail'
import Invoices from './pages/admin/Invoices'
import InvoicesList from './pages/admin/invoices/InvoicesList'
import InvoiceDetail from './pages/admin/invoices/InvoiceDetail'
import StripeEnsure from './pages/admin/StripeEnsure'
import TeamPeriod from './pages/admin/TeamPeriod'
import TeamsList from './pages/admin/teams/TeamsList'
import TeamDetail from './pages/admin/teams/TeamDetail'
import AdminSettings from './pages/admin/Settings'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <PrimerHome /> },
      { path: 'primer/preview', element: <PrimerPreview /> },
      {
        path: 'dashboard',
        element: <UserLayout />,
        children: [
          { index: true, element: <Overview /> },
          { path: 'overview', element: <Overview /> },
          { path: 'period', element: <Period /> },
          { path: 'daily', element: <Daily /> },
          { path: 'summary', element: <Summary /> },
          { path: 'overdraft', element: <Overdraft /> },
          { path: 'wallets', element: <Wallets /> },
          { path: 'ledger', element: <Ledger /> },
          { path: 'proxy', element: <Proxy /> },
          { path: 'purchase', element: <Purchase /> },
        ],
      },
      {
        path: 'admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <PlansList /> },
          // New plans routes
          { path: 'plans', element: <PlansList /> },
          { path: 'plans/:planId', element: <NewPlanDetail /> },

          // Legacy routes (kept for fallback)
          { path: 'plan/create', element: <PlanCreate /> },
          { path: 'plan/daily', element: <PlanDaily /> },
          { path: 'plan/usage', element: <PlanUsage /> },
          { path: 'plan/pricerule', element: <PlanPriceRule /> },
          { path: 'plan/assign', element: <PlanAssign /> },
          { path: 'plan/detail', element: <PlanDetail /> },
          { path: 'price-mappings', element: <PriceMappings /> },
          { path: 'customers', element: <CustomersList /> },
          { path: 'customers/:customerId', element: <CustomerDetail /> },
          { path: 'customers/legacy', element: <Customers /> },
          { path: 'subscriptions', element: <SubscriptionsList /> },
          { path: 'subscriptions/:subscriptionId', element: <SubscriptionDetail /> },
          { path: 'subscriptions/legacy', element: <Subscriptions /> },
          { path: 'invoices', element: <InvoicesList /> },
          { path: 'invoices/:invoiceId', element: <InvoiceDetail /> },
          { path: 'invoices/legacy', element: <Invoices /> },
          { path: 'teams', element: <TeamsList /> },
          { path: 'teams/:teamId', element: <TeamDetail /> },
          { path: 'team-period', element: <TeamPeriod /> },
          { path: 'stripe-ensure', element: <StripeEnsure /> },
          { path: 'team-period', element: <TeamPeriod /> },
          { path: 'settings', element: <AdminSettings /> },
        ],
      },
    ],
  },
      { path: '/auth/callback', element: <AuthCallback /> },
  { path: '/health', element: <Health /> },
  { path: '/login', element: <Login /> },
  { path: '/admin/login', element: <AdminLogin /> },
  { path: '/settings', element: <Settings /> },
])

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
