import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { Send, User } from 'lucide-react'

export default function Chat() {
    const { userId } = useParams()
    const { user } = useAuth()
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [otherUser, setOtherUser] = useState(null)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        if (userId) {
            fetchOtherUser()
            fetchMessages()
            const subscription = subscribeToMessages()
            return () => {
                subscription.unsubscribe()
            }
        }
    }, [userId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchOtherUser = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
        setOtherUser(data)
    }

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true })

        if (error) console.error(error)
        else setMessages(data)
    }

    const subscribeToMessages = () => {
        return supabase
            .channel('chat_room')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}` // Listen for messages sent TO me
                },
                (payload) => {
                    if (payload.new.sender_id === userId) {
                        setMessages(prev => [...prev, payload.new])
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${user.id}` // Listen for messages sent BY me (from other tabs?)
                },
                (payload) => {
                    // Optional: verify it's not duplicate if we optimistic update
                    // For now, we rely on fetch or optimistic UI, but listening to own inserts helps sync tabs.
                    if (payload.new.receiver_id === userId) {
                        // Check if already exists to avoid dupes (react strict mode etc)
                        setMessages(prev => {
                            const exists = prev.find(m => m.id === payload.new.id)
                            if (exists) return prev
                            return [...prev, payload.new]
                        })
                    }
                }
            )
            .subscribe()
    }

    const sendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        const msg = {
            sender_id: user.id,
            receiver_id: userId,
            content: newMessage.trim()
        }

        try {
            // Optimistic update
            // setMessages(prev => [...prev, { ...msg, created_at: new Date().toISOString(), id: 'temp-' + Date.now() }])

            const { data, error } = await supabase.from('messages').insert(msg).select().single()
            if (error) throw error

            setNewMessage('')
            setMessages(prev => [...prev, data])
        } catch (error) {
            console.error('Error sending message:', error)
            alert('Failed to send message')
        }
    }

    if (!userId) return <div className="text-center py-12 text-gray-500">Select a conversation</div>

    return (
        <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                    {otherUser?.full_name?.[0] || <User className="w-5 h-5" />}
                </div>
                <div>
                    <div className="font-bold text-gray-900">{otherUser?.full_name || 'Loading...'}</div>
                    <div className="text-xs text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Online
                    </div>
                </div>
            </div>

            <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-white">
                {messages.map(msg => {
                    const isMe = msg.sender_id === user.id
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] p-4 rounded-2xl text-sm ${isMe
                                    ? 'bg-primary-600 text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:hover:bg-primary-600"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    )
}
