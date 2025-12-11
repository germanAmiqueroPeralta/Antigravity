import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { MapPin, DollarSign, Clock, Building, Send, FileText, CheckCircle } from 'lucide-react'

export default function JobDetail() {
    const { id } = useParams()
    const { user, profile } = useAuth()
    const navigate = useNavigate()
    const [job, setJob] = useState(null)
    const [loading, setLoading] = useState(true)
    const [applying, setApplying] = useState(false)
    const [file, setFile] = useState(null)
    const [hasApplied, setHasApplied] = useState(false)

    useEffect(() => {
        fetchJob()
        if (user) checkApplicationStatus()
    }, [id, user])

    const fetchJob = async () => {
        const { data, error } = await supabase
            .from('jobs')
            .select(`*, profiles:employer_id (*)`)
            .eq('id', id)
            .single()
        if (!error) setJob(data)
        setLoading(false)
    }

    const checkApplicationStatus = async () => {
        const { data } = await supabase
            .from('applications')
            .select('id')
            .eq('job_id', id)
            .eq('applicant_id', user.id)
            .single()
        if (data) setHasApplied(true)
    }

    const handleApply = async (e) => {
        e.preventDefault()
        if (!file) return alert('Please upload a CV')

        setApplying(true)
        try {
            // 1. Upload CV
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('cvs')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(filePath)
            // Note: Since bucket is private, we probably store the path or a signed URL. 
            // For simplicity in this demo, we store the full path to generate signed URLs later.
            // Or we can rely on RLS and just store the path.

            // 2. Create Application
            const { error: appError } = await supabase.from('applications').insert({
                job_id: id,
                applicant_id: user.id,
                cv_url: filePath // Storing path to keep it secure
            })

            if (appError) throw appError

            setHasApplied(true)
        } catch (error) {
            alert(error.message)
        } finally {
            setApplying(false)
        }
    }

    const startChat = async () => {
        if (!user) return navigate('/login')
        // Logic to find or create a conversation would go here.
        // For now, we can navigate to a chat page with the employer ID.
        navigate(`/chat/${job.employer_id}`)
    }

    if (loading) return <div className="text-center py-12">Loading...</div>
    if (!job) return <div className="text-center py-12">Job not found</div>

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                        <div className="flex items-center gap-2 text-primary-600 font-medium mb-4">
                            <Building className="w-5 h-5" />
                            {job.profiles?.full_name}
                        </div>

                        <div className="flex flex-wrap gap-6 text-gray-600">
                            {job.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-gray-400" />
                                    {job.location}
                                </div>
                            )}
                            {job.salary_range && (
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-gray-400" />
                                    {job.salary_range}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-gray-400" />
                                {new Date(job.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {user && user.id !== job.employer_id && (
                        <div className="flex flex-col gap-3 min-w-[200px]">
                            {!hasApplied ? (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h3 className="font-semibold text-gray-900 mb-3">Apply Now</h3>
                                    <form onSubmit={handleApply} className="space-y-3">
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={e => setFile(e.target.files[0])}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                required
                                            />
                                            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-primary-500 transition-colors">
                                                <FileText className="w-4 h-4" />
                                                <span className="truncate">{file ? file.name : 'Upload CV (PDF)'}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={applying || !file}
                                            className="w-full bg-black text-white py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                        >
                                            {applying ? 'Sending...' : 'Submit Application'}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center justify-center gap-2 font-medium">
                                    <CheckCircle className="w-5 h-5" />
                                    Applied Successfully
                                </div>
                            )}

                            <button
                                onClick={startChat}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                                Contact Employer
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                        <div className="prose text-gray-600 max-w-none whitespace-pre-wrap">{job.description}</div>
                    </section>

                    {job.requirements && (
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
                            <div className="prose text-gray-600 max-w-none whitespace-pre-wrap">{job.requirements}</div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    )
}
