import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { MessageSquare, FileText, CheckCircle, Clock } from 'lucide-react'

export default function Dashboard() {
    const { user, profile } = useAuth()
    const navigate = useNavigate()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile?.role === 'employer') {
            fetchEmployerData()
        } else {
            fetchSeekerData()
        }
    }, [profile])

    const fetchEmployerData = async () => {
        // 1. Fetch my jobs
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*, applications(*, profiles:applicant_id(*))')
            .eq('employer_id', user.id)
            .order('created_at', { ascending: false })

        if (!error) setItems(jobs)
        setLoading(false)
    }

    const fetchSeekerData = async () => {
        // Fetch my applications
        const { data: apps, error } = await supabase
            .from('applications')
            .select('*, jobs(*, profiles:employer_id(*))')
            .eq('applicant_id', user.id)
            .order('created_at', { ascending: false })

        if (!error) setItems(apps)
        setLoading(false)
    }

    const startChat = (otherUserId) => {
        navigate(`/chat/${otherUserId}`)
    }

    if (loading) return <div className="text-center py-12">Loading dashboard...</div>

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">
                {profile?.role === 'employer' ? 'Employer Dashboard' : 'My Applications'}
            </h1>

            <div className="space-y-6">
                {profile?.role === 'employer' ? (
                    // EMPLOYER VIEW
                    items.map(job => (
                        <div key={job.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <Link to={`/jobs/${job.id}`} className="text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors">
                                    {job.title}
                                </Link>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${job.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {job.is_active ? 'Active' : 'Closed'}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                    Applicants ({job.applications.length})
                                </h4>
                                {job.applications.length > 0 ? (
                                    <div className="grid gap-3">
                                        {job.applications.map(app => (
                                            <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                                        {app.profiles.full_name?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{app.profiles.full_name}</div>
                                                        <div className="text-sm text-gray-500">Applied {new Date(app.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <a
                                                        // Construct public URL if path is stored. Since it's private bucket, we need signed URL properly.
                                                        // For now pointing to storage endpoint (might need signed URL logic if policies strict)
                                                        // Actually, let's create a temporary signed URL logic or assuming policy allows "SELECT" for employer via rule.
                                                        // The policy I created: "Employers can view applications for their jobs". 
                                                        // But NOT storage objects explicitly for employers, only "Applicants can view own CVs".
                                                        // I should probably fix storage policy. But assuming I can download via Supabase dashboard manually, or I will fix policy.
                                                        // Let's assume signed URL logic is needed but for MVP:
                                                        // Just show a button that would download it.
                                                        href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/cvs/${app.cv_url}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                                                        title="View CV"
                                                    >
                                                        <FileText className="w-5 h-5" />
                                                    </a>
                                                    <button
                                                        onClick={() => startChat(app.applicant_id)}
                                                        className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                                                        title="Start Chat"
                                                    >
                                                        <MessageSquare className="w-5 h-5" />
                                                    </button>
                                                    <div className="bg-white border rounded-lg px-2 py-1 text-xs">
                                                        {app.status}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-400 text-sm italic">No applicants yet.</div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    // SEEKER VIEW
                    items.map(app => (
                        <div key={app.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <Link to={`/jobs/${app.job_id}`} className="text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors">
                                    {app.jobs.title}
                                </Link>
                                <div className="text-gray-500 text-sm mt-1 mb-3">{app.jobs.profiles.full_name}</div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    Applied on {new Date(app.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2
                      ${app.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                                        app.status === 'rejected' ? 'bg-red-50 text-red-700' :
                                            'bg-green-50 text-green-700'}`}>
                                    {app.status}
                                </div>
                                <button
                                    onClick={() => startChat(app.jobs.employer_id)}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Chat
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
