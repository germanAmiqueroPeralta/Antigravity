import { Link } from 'react-router-dom'
import { Briefcase, Search, ArrowRight } from 'lucide-react'

export default function Home() {
    return (
        <div className="space-y-16 py-10">
            {/* Hero Section */}
            <section className="text-center space-y-6 max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900">
                    Find your <span className="text-primary-600">dream job</span> <br />
                    or the perfect candidate.
                </h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                    The most effective platform for connecting talent with opportunity.
                    Post jobs, apply with ease, and chat directly.
                </p>
                <div className="flex justify-center gap-4 pt-4">
                    <Link to="/jobs" className="px-8 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Browse Jobs
                    </Link>
                    <Link to="/post-job" className="px-8 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center gap-2">
                        Post a Job
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Featured Stats or Categories could go here */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {[
                    { label: 'Active Jobs', value: '1,200+' },
                    { label: 'Companies', value: '350+' },
                    { label: 'Job Seekers', value: '15k+' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-gray-500 font-medium">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
