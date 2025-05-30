// src/components/chat/business-assistant.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSupabase } from '@/hooks/useSupabase'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type ContactData = {
  full_name: string
  email: string
  phone?: string
}

type BusinessAssistantProps = {
  business: {
    id: string
    name: string
    description?: string
    short_description?: string
    categories?: string[]
    locations?: {
      address_line1: string
      city: string
      state: string
    }[]
    business_contacts?: {
      type: string
      value: string
    }[]
  }
}

export default function BusinessAssistant({ business }: BusinessAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showContactForm, setShowContactForm] = useState(true)
  const [contactData, setContactData] = useState<ContactData>({
    full_name: '',
    email: '',
    phone: ''
  })
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)
  const [contactId, setContactId] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isValidatingSession, setIsValidatingSession] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = useSupabase()
  const user = supabase?.user || null

  // Professional session management - check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const existingToken = urlParams.get('chat_session')
        
        if (existingToken) {
          // Validate session with backend
          const response = await fetch(`/api/chat/sessions?token=${existingToken}&business_id=${business.id}`)
          
          if (response.ok) {
            const data = await response.json()
            
            // Session is valid - restore chat state
            setSessionToken(existingToken)
            setContactId(data.session.contact_id)
            setShowContactForm(false)
            
            // Pre-fill contact data for display purposes
            if (data.session.contact) {
              const contact = data.session.contact
              setContactData({
                full_name: `${contact.first_name} ${contact.last_name}`.trim(),
                email: contact.email,
                phone: contact.phone || ''
              })
            }
            
            // Initialize chat with welcome message
            const firstName = data.session.contact?.first_name || 'there'
            setMessages([
              {
                role: 'assistant',
                content: `Welcome back ${firstName}! I'm here to help you with ${business.name}. How can I assist you today?`
              }
            ])
          } else {
            // Invalid session - remove from URL and show form
            const newUrl = window.location.pathname
            window.history.replaceState({}, '', newUrl)
          }
        }
      } catch (error) {
        console.error('Error validating session:', error)
        // On error, just show the form
      } finally {
        setIsValidatingSession(false)
      }
    }
    
    checkExistingSession()
  }, [business.id])

  // Auto-open after 3 seconds (only if no session validation in progress)
  useEffect(() => {
    if (!isValidatingSession) {
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [isValidatingSession])

  // Pre-fill form data for authenticated users
  useEffect(() => {
    if (user && showContactForm) {
      setContactData({
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || ''
      })
    }
  }, [user, showContactForm])
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize welcome message when contact form is completed
  const initializeChat = (contactName: string, isReturning: boolean = false) => {
    const welcomeMessage = isReturning 
      ? `Welcome back ${contactName}! I'm here to help you with ${business.name}. How can I assist you today?`
      : `Hi ${contactName}! I'm the virtual assistant for ${business.name}. How can I help you today?`
      
    setMessages([
      {
        role: 'assistant',
        content: welcomeMessage
      }
    ])
  }

  // Professional session management - update URL with session token
  const updateUrlWithSession = (token: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('chat_session', token)
    window.history.pushState({}, '', url.toString())
  }

  // Validate contact form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!contactData.full_name?.trim()) {
      errors.full_name = 'Full name is required'
    }
    
    if (!contactData.email?.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
      errors.email = 'Please enter a valid email'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle contact form submission with professional session management
  const handleContactSubmit = async () => {
    if (!validateForm()) return
    
    setIsSubmittingContact(true)
    setFormErrors({})
    
    try {
      const response = await fetch('/api/crm/integration/contact-from-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: business.id,
          contact_data: contactData,
          user_id: user?.id || null
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 409) {
          // Existing contact - setup session and continue
          const contactId = data.contact_id || data.session?.contact_id
          const sessionToken = data.session?.token
          
          if (contactId && sessionToken) {
            setContactId(contactId)
            setSessionToken(sessionToken)
            setShowContactForm(false)
            updateUrlWithSession(sessionToken)
            
            const firstName = contactData.full_name.split(' ')[0]
            initializeChat(firstName, true) // true = returning customer
          }
          return
        }
        throw new Error(data.error || 'Failed to save contact information')
      }
      
      // New contact created successfully
      const contactId = data.contact.id
      const sessionToken = data.session?.token
      
      if (contactId && sessionToken) {
        setContactId(contactId)
        setSessionToken(sessionToken)
        setShowContactForm(false)
        updateUrlWithSession(sessionToken)
        
        const firstName = contactData.full_name.split(' ')[0]
        initializeChat(firstName, false) // false = new customer
      } else {
        throw new Error('Session creation failed')
      }
      
    } catch (error) {
      console.error('Error submitting contact:', error)
      setFormErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to save contact information. Please try again.' 
      })
    } finally {
      setIsSubmittingContact(false)
    }
  }
  
  const handleSendMessage = async () => {
    if (!input.trim() || !contactId) return
    
    // Add user message
    const userMessage = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      // Create context about the business for the AI
      const businessContext = `
        Business Name: ${business.name}
        ${business.short_description ? `Short Description: ${business.short_description}` : ''}
        ${business.description ? `Full Description: ${business.description}` : ''}
        ${business.categories?.length ? `Categories: ${business.categories.join(', ')}` : ''}
        ${business.locations?.length ? `Location: ${business.locations[0].address_line1}, ${business.locations[0].city}, ${business.locations[0].state}` : ''}
        ${business.business_contacts?.length ? `Contact: ${business.business_contacts.map(c => `${c.type}: ${c.value}`).join(', ')}` : ''}
      `.trim()
      
      // Call your API that connects to OpenAI
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a helpful virtual assistant for ${business.name}. Be friendly, professional, and concise. You represent this business and should help customers with information and questions. The customer's name is ${contactData.full_name.split(' ')[0]}. Here's information about the business: ${businessContext}`
            },
            ...messages,
            userMessage
          ],
          businessId: business.id,
          contactId: contactId,
          sessionToken: sessionToken // Include session token for tracking
        }),
      })
      
      const data = await response.json()
      
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting. Please try again later or contact us directly." 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // End chat session (professional cleanup)
  const endChatSession = async () => {
    if (sessionToken) {
      try {
        await fetch(`/api/chat/sessions?token=${sessionToken}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Error ending session:', error)
      }
    }
    
    // Reset state and URL
    setSessionToken(null)
    setContactId(null)
    setShowContactForm(true)
    setMessages([])
    setContactData({ full_name: '', email: '', phone: '' })
    
    // Clean URL
    const newUrl = window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }
  
  return (
    <>
      {/* Floating chat button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 mb-20 md:mb-0 shadow-lg hover:bg-blue-700 transition-all z-40 animate-bounce-subtle"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            ?
          </div>
        </button>
      )}
      
      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white rounded-lg mb-[4.55rem] md:mb-0 shadow-xl z-50 flex flex-col max-h-[600px] border border-gray-200">
          {/* Chat header with session status */}
          <div className="flex items-center justify-between bg-blue-600 text-white p-4 rounded-t-lg">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-white text-blue-600 flex items-center justify-center mr-2 font-bold">
                {business.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-medium">{business.name} Assistant</h3>
                <div className="flex items-center text-xs">
                  <span className="flex h-2 w-2 relative mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  {sessionToken ? 'Session Active' : 'Online'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {sessionToken && (
                <button 
                  onClick={endChatSession}
                  className="text-white hover:text-gray-200 text-xs"
                  title="End Chat Session"
                >
                  Reset
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Loading state for session validation */}
          {isValidatingSession ? (
            <div className="p-6 bg-gray-50 flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Checking session...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Contact form or messages */}
              {showContactForm ? (
            <div className="p-6 bg-white">
              <div className="text-center mb-6">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                  {business.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Chat with {business.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Please provide your contact information to start the conversation
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="contact-full-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="contact-full-name"
                    value={contactData.full_name}
                    onChange={(e) => setContactData(prev => ({ ...prev, full_name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.full_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                  {formErrors.full_name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.full_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    value={contactData.email}
                    onChange={(e) => setContactData(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="john@example.com"
                    disabled={!!user}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    id="contact-phone"
                    value={contactData.phone || ''}
                    onChange={(e) => setContactData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {formErrors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-600 text-sm">{formErrors.submit}</p>
                  </div>
                )}

                <button
                  onClick={handleContactSubmit}
                  disabled={isSubmittingContact}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isSubmittingContact ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Starting Chat...
                    </div>
                  ) : (
                    'Start Conversation'
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Your information will be used to personalize your experience and may be stored for future communications.
                </p>
              </div>
            </div>
            
          ) : (
            <>
              {/* Messages container */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50 min-h-[300px]">
                {messages.map((message, index) => (
                  <div key={index} className={`mb-4 ${message.role === 'assistant' ? 'text-left' : 'text-right'}`}>
                    <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                      message.role === 'assistant' 
                        ? 'bg-white text-gray-800 shadow-sm' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="text-left mb-4">
                    <div className="inline-block p-3 rounded-lg max-w-[80%] bg-white text-gray-800">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input area */}
              <div className="border-t p-3 bg-white rounded-b-lg">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-l-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading}
                    className="bg-blue-600 text-white py-2 px-4 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    </button>
                </div>
              </div>
            </>)
}</>
          )}
        </div>
      )}
    </>
  )
}