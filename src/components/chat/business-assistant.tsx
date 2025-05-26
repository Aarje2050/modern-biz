// src/components/chat/business-assistant.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

type Message = {
  role: 'user' | 'assistant'
  content: string
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
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi there! I'm the virtual assistant for ${business.name}. How can I help you today?`
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Auto-open after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSendMessage = async () => {
    if (!input.trim()) return
    
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
              content: `You are a helpful virtual assistant for ${business.name}. Be friendly, professional, and concise. You represent this business and should help customers with information and questions. Here's information about the business: ${businessContext}`
            },
            ...messages,
            userMessage
          ],
          businessId: business.id
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
  
  return (
    <>
      {/* Floating chat button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 mb-20 md:mb-0 shadow-lg hover:bg-blue-700 transition-all z-40 animate-bounce-subtle"
          >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
      
      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white rounded-lg mb-[4.55rem] md:mb-0 shadow-xl z-50 flex flex-col max-h-[500px] border border-gray-200">
          {/* Chat header */}
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
                  Online
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Messages container */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
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
        </div>
      )}
    </>
  )
}