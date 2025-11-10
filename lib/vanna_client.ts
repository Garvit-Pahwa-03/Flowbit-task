export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sql?: string;
  results?: {
    columns: string[];
    data: Record<string, any>[];
    row_count: number;
  };
  error?: string;
  timestamp: Date;
}

export interface ChatResponse {
  question: string;
  sql: string;
  results: {
    columns: string[];
    data: Record<string, any>[];
    row_count: number;
  };
  error: string | null;
}

export async function sendChatQuery(question: string): Promise<ChatResponse> {
  const response = await fetch('/api/chat-with-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get response');
  }

  return response.json();
}