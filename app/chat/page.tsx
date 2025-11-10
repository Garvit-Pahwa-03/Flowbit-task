'use client';

import { useState } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  results?: {
    columns: string[];
    data: any[];
    row_count: number;
  };
  error?: string;
}

export default function ChatWithData() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat-with-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input }),
      });

      const data = await response.json();
      console.log('Response from API:', data);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.error 
          ? `Error: ${data.error}` 
          : `Found ${data.results?.row_count || 0} results`,
        sql: data.sql,
        results: data.results,
        error: data.error,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${error.message}`,
        error: error.message,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-3xl rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="mb-2">{message.content}</p>
              
              {/* Display SQL if available */}
              {message.sql && (
                <div className="mt-2 bg-gray-800 text-green-400 p-2 rounded text-sm">
                  <p className="font-semibold mb-1">Generated SQL:</p>
                  <pre className="whitespace-pre-wrap">{message.sql}</pre>
                </div>
              )}
              
              {/* Display results if available */}
              {message.results && message.results.data.length > 0 && (
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-full border border-gray-300 text-sm">
                    <thead className="bg-gray-200">
                      <tr>
                        {message.results.columns.map((col, i) => (
                          <th key={i} className="border px-2 py-1">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {message.results.data.map((row, i) => (
                        <tr key={i}>
                          {message.results!.columns.map((col, j) => (
                            <td key={j} className="border px-2 py-1">
                              {String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your data..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}