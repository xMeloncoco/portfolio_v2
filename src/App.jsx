/**
 * ========================================
 * MAIN APP COMPONENT
 * ========================================
 * This is the root component that sets up routing
 * and handles all navigation in the application
 *
 * FEATURES:
 * - React Router for navigation
 * - Protected routes for admin pages
 * - Public login page
 * - Redirects for unauthenticated users
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { logger } from './utils/logger'

// Import layouts
import AdminLayout from './layouts/AdminLayout'

// Import components
import ProtectedRoute from './components/ProtectedRoute'

// Import pages
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import CharacterStats from './pages/CharacterStats'
import Pages from './pages/Pages'
import PageForm from './pages/PageForm'
import PageView from './pages/PageView'
import Quests from './pages/Quests'
import Inventory from './pages/Inventory'
import Skills from './pages/Skills'
import ThemeSettings from './pages/ThemeSettings'

// ========================================
// APP COMPONENT
// ========================================

function App() {
  // Log app initialization
  logger.info('🚀 Portfolio V2 App initialized')

  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================
         * ROOT REDIRECT
         * Redirects / to /admin
         * ======================================== */}
        <Route
          path="/"
          element={<Navigate to="/admin" replace />}
        />

        {/* ========================================
         * LOGIN PAGE (Public)
         * Anyone can access this page
         * ======================================== */}
        <Route
          path="/admin/login"
          element={<Login />}
        />

        {/* ========================================
         * ADMIN ROUTES (Protected)
         * All admin routes require authentication
         * Each route is wrapped in ProtectedRoute and AdminLayout
         * ======================================== */}

        {/* Admin Dashboard (Overview) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Character Stats Page */}
        <Route
          path="/admin/character-stats"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CharacterStats />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Pages Management */}
        <Route
          path="/admin/pages"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Pages />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Create New Page */}
        <Route
          path="/admin/pages/new"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <PageForm />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* View Page Details */}
        <Route
          path="/admin/pages/:id"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <PageView />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Edit Page */}
        <Route
          path="/admin/pages/:id/edit"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <PageForm />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Quests Management */}
        <Route
          path="/admin/quests"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Quests />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Inventory & Achievements */}
        <Route
          path="/admin/inventory"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Inventory />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Skills Management */}
        <Route
          path="/admin/skills"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Skills />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Theme Settings */}
        <Route
          path="/admin/theme"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ThemeSettings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* ========================================
         * 404 NOT FOUND
         * Any unmatched route redirects to admin
         * ======================================== */}
        <Route
          path="*"
          element={<Navigate to="/admin" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

// ========================================
// EXPORTS
// ========================================

export default App
