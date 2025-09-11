import React from 'react'
import { Outlet } from 'react-router-dom'
import Layout from './components/Layout'
import { UIProvider } from './context/UIContext'

export default function App() {
  return (
    <UIProvider>
      <Layout>
        <Outlet />
      </Layout>
    </UIProvider>
  )
}
