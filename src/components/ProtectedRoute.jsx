import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, role }) {
    const { user, profile, loading } = useAuth()

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>

    if (!user) return <Navigate to="/login" />

    if (role && profile?.role !== role) {
        return <Navigate to="/" />
    }

    return children
}
