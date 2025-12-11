import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { MapPin, DollarSign, Clock } from 'lucide-react'

export default function Jobs() {
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchJobs()
    }, [])

    const fetchJobs = async () => {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select(`
          *,
          profiles:employer_id (full_name, avatar_url)
        `)
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (error) throw error
            setJobs(data)
        } catch (error) {
            console.error('Error fetching jobs:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Latest Opportunities</h1>
                <input
                    type="text"
                    placeholder="Search jobs..."
                    className="w-full md:w-96 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-12">Loading jobs...</div>
            ) : (
                <div className="grid gap-4">
                    {filteredJobs.map(job => (
                        <Link key={job.id} to={`/jobs/${job.id}`} className="block">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                                            {job.title}
                                        </h3>
                                        <p className="text-gray-500 text-sm mt-1">{job.profiles?.full_name}</p>

                                        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                                            {job.location && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    {job.location}
                                                </div>
                                            )}
                                            {job.salary_range && (
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="w-4 h-4 text-gray-400" />
                                                    {job.salary_range}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                {new Date(job.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Could add Apply button or status here */}
                                </div>
                            </div>
                        </Link>
                    ))}
                    {filteredJobs.length === 0 && (
                        <div className="text-center py-12 text-gray-500">No jobs found matching your search.</div>
                    )}
                </div>
            )}
        </div>
    )
}
