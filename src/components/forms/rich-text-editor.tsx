'use client'

// src/components/forms/rich-text-editor.tsx
import { useState, useRef, useCallback, useEffect } from 'react'

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  required?: boolean
  className?: string
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Start writing...",
  maxLength = 2000,
  required = false,
  className = ""
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [textLength, setTextLength] = useState(0)
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (editorRef.current) {
      const text = editorRef.current.textContent || ''
      setTextLength(text.length)
    }
  }, [value])

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  // Check active formats
  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>()
    
    if (document.queryCommandState('bold')) formats.add('bold')
    if (document.queryCommandState('italic')) formats.add('italic')
    if (document.queryCommandState('underline')) formats.add('underline')
    if (document.queryCommandState('insertUnorderedList')) formats.add('ul')
    if (document.queryCommandState('insertOrderedList')) formats.add('ol')
    
    // Check heading level
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      let node = selection.getRangeAt(0).commonAncestorContainer
      if (node.nodeType === Node.TEXT_NODE) {
        if (node) {
          node = node!.parentNode as Node
        }
      }
      
      let element = node as Element
      while (element && element !== editorRef.current) {
        const tagName = element.tagName?.toLowerCase()
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          formats.add(tagName)
          break
        }
        element = element.parentElement as Element
      }
    }
    
    setActiveFormats(formats)
  }, [])

  const execCommand = useCallback((command: string, value?: string) => {
    editorRef.current?.focus()
    
    if (command === 'formatBlock') {
      document.execCommand('formatBlock', false, value)
    } else {
      document.execCommand(command, false, value)
    }
    
    setTimeout(() => {
      if (editorRef.current) {
        const content = sanitizeContent(editorRef.current.innerHTML)
        onChange(content)
        updateActiveFormats()
      }
    }, 10)
  }, [onChange, updateActiveFormats])

  const sanitizeContent = (html: string): string => {
    const temp = document.createElement('div')
    temp.innerHTML = html
    
    // Remove all links
    const links = temp.querySelectorAll('a')
    links.forEach(link => {
      const textNode = document.createTextNode(link.textContent || '')
      link.parentNode?.replaceChild(textNode, link)
    })
    
    // Remove scripts and unwanted elements
    const unwantedElements = temp.querySelectorAll('script, style, meta, link')
    unwantedElements.forEach(el => el.remove())
    
    // Clean attributes
    const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote']
    const walker = document.createTreeWalker(
      temp,
      NodeFilter.SHOW_ELEMENT,
      null
    )
    
    const elementsToClean: Element[] = []
    let node = walker.nextNode()
    
    while (node) {
      const element = node as Element
      if (!allowedTags.includes(element.tagName.toLowerCase())) {
        elementsToClean.push(element)
      } else {
        // Remove all attributes
        const attrs = Array.from(element.attributes)
        attrs.forEach(attr => element.removeAttribute(attr.name))
      }
      node = walker.nextNode()
    }
    
    // Replace unwanted elements with their text content
    elementsToClean.forEach(element => {
      const textNode = document.createTextNode(element.textContent || '')
      element.parentNode?.replaceChild(textNode, element)
    })
    
    return temp.innerHTML
  }

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      const text = editorRef.current.textContent || ''
      
      if (text.length <= maxLength) {
        setTextLength(text.length)
        const cleanContent = sanitizeContent(content)
        onChange(cleanContent)
      } else {
        editorRef.current.innerHTML = value
        setTextLength(editorRef.current.textContent?.length || 0)
      }
      
      updateActiveFormats()
    }
  }, [onChange, value, maxLength, updateActiveFormats])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    
    const text = e.clipboardData.getData('text/plain')
    
    if (document.queryCommandSupported('insertText')) {
      document.execCommand('insertText', false, text)
    } else {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(document.createTextNode(text))
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }
    
    handleInput()
  }, [handleInput])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          execCommand('bold')
          break
        case 'i':
          e.preventDefault()
          execCommand('italic')
          break
        case 'u':
          e.preventDefault()
          execCommand('underline')
          break
        case 'k': // Prevent link creation
          e.preventDefault()
          break
      }
    }
  }, [execCommand])

  const formatButtons = [
    {
      command: 'bold',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 4a1 1 0 011-1h3a3 3 0 110 6H6v2h3a3 3 0 110 6H6a1 1 0 01-1-1V4zm2 2v3h2a1 1 0 100-2H7zm0 5v3h3a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      ),
      title: 'Bold (Ctrl+B)',
      isActive: activeFormats.has('bold')
    },
    {
      command: 'italic',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 14a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 5.677V6a1 1 0 11-2 0V3a1 1 0 011-1z" />
        </svg>
      ),
      title: 'Italic (Ctrl+I)',
      isActive: activeFormats.has('italic')
    },
    {
      command: 'underline',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M14 12V7a4 4 0 10-8 0v5a4 4 0 008 0zm-2 0V7a2 2 0 10-4 0v5a2 2 0 004 0zM4 17h12a1 1 0 010 2H4a1 1 0 010-2z" />
        </svg>
      ),
      title: 'Underline (Ctrl+U)',
      isActive: activeFormats.has('underline')
    }
  ]

  const headingOptions = [
    { label: 'Normal', value: '<p>', isActive: !Array.from(activeFormats).some(f => f.startsWith('h')) },
    { label: 'H1', value: '<h1>', isActive: activeFormats.has('h1') },
    { label: 'H2', value: '<h2>', isActive: activeFormats.has('h2') },
    { label: 'H3', value: '<h3>', isActive: activeFormats.has('h3') },
    { label: 'H4', value: '<h4>', isActive: activeFormats.has('h4') }
  ]

  const listButtons = [
    {
      command: 'insertUnorderedList',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      ),
      title: 'Bullet List',
      isActive: activeFormats.has('ul')
    },
    {
      command: 'insertOrderedList',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 01.707-.293l6 6a1 1 0 010 1.414l-6 6A1 1 0 012 16v-3.586l4.293-4.293L2 4.414V4z" clipRule="evenodd" />
        </svg>
      ),
      title: 'Numbered List',
      isActive: activeFormats.has('ol')
    }
  ]

  return (
    <div className={`border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white ${className}`}>
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Heading Dropdown */}
          <div className="relative">
            <select
              onChange={(e) => execCommand('formatBlock', e.target.value)}
              className="text-sm border-0 bg-transparent focus:ring-0 font-medium text-gray-700 pr-8"
              value={headingOptions.find(h => h.isActive)?.value || '<p>'}
            >
              {headingOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Format Buttons */}
          {formatButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              onClick={() => execCommand(button.command)}
              className={`p-2 rounded-lg transition-colors ${
                button.isActive 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
              title={button.title}
            >
              {button.icon}
            </button>
          ))}

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* List Buttons */}
          {listButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              onClick={() => execCommand(button.command)}
              className={`p-2 rounded-lg transition-colors ${
                button.isActive 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
              title={button.title}
            >
              {button.icon}
            </button>
          ))}

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Quote Button */}
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<blockquote>')}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
            title="Quote"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          <div className="flex-1" />
          
          {/* Character Count */}
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${
            textLength > maxLength * 0.9 
              ? 'text-red-700 bg-red-100' 
              : textLength > maxLength * 0.75
              ? 'text-yellow-700 bg-yellow-100'
              : 'text-gray-600 bg-gray-100'
          }`}>
            {textLength}/{maxLength}
          </span>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onMouseUp={updateActiveFormats}
        onKeyUp={updateActiveFormats}
        className="min-h-[180px] p-4 focus:outline-none prose prose-sm max-w-none"
        style={{
          WebkitUserSelect: 'text',
          userSelect: 'text'
        }}
        data-placeholder={!value ? placeholder : ''}
        suppressContentEditableWarning={true}
      />
      
      {/* Custom Styles */}
      <style jsx>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
          font-style: italic;
        }
        
        .prose blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin-left: 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .prose h1 {
          font-size: 1.875rem;
          font-weight: 700;
          line-height: 1.2;
          margin: 1rem 0 0.5rem 0;
        }
        
        .prose h2 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.3;
          margin: 0.875rem 0 0.5rem 0;
        }
        
        .prose h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 0.75rem 0 0.5rem 0;
        }
        
        .prose h4 {
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 0.75rem 0 0.5rem 0;
        }
        
        .prose p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }
        
        .prose ul, .prose ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        
        .prose li {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  )
}