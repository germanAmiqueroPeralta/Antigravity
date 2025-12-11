import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Briefcase, User, LogOut } from 'lucide-react'

export default function Navbar() {
    const { user, profile, signOut } = useAuth()

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 transition-all duration-300">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="bg-primary-100 p-2 rounded-lg group-hover:bg-primary-200 transition-colors">
                            <Briefcase className="w-6 h-6 text-primary-600" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-500">
                            Job<span className="hidden sm:inline">Connect</span>
                        </span>
                    </Link>

                    <div className="flex items-center space-x-6">
                        <Link to="/jobs" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
                            Find Jobs
                        </Link>
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <Link to="/dashboard" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
                                    Dashboard
                                </Link>
                                {profile?.role === 'employer' && (
                                    <Link to="/post-job" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-md shadow-primary-500/20 text-sm font-semibold">
                                        Post Job
                                    </Link>
                                )}
                                <div className="flex items-center space-x-3 text-gray-700 border-l pl-4 border-gray-200">
                                    <div className="text-right hidden md:block">
                                        <p className="text-sm font-semibold text-gray-900 leading-none">{profile?.full_name}</p>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">{profile?.role?.replace('_', ' ')}</p>
                                    </div>
                                    <button onClick={signOut} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50">
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link to="/login" className="px-4 py-2 text-gray-600 hover:text-primary-700 font-semibold transition-colors">
                                    Login
                                </Link>
                                <Link to="/register" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl text-sm font-semibold">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
