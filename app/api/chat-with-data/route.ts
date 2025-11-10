import { NextRequest, NextResponse } from 'next/server';

const VANNA_API_URL = process.env.VANNA_API_BASE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question } = body;

    console.log('Received question:', question);
    console.log('Vanna API URL:', VANNA_API_URL);

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    const cleanedBaseUrl = VANNA_API_URL.replace(/\/$/, "");
    const fullVannaUrl = cleanedBaseUrl + "/query";
    console.log(`Constructed URL for Vanna: ${fullVannaUrl}`);

    const vannaResponse = await fetch(fullVannaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    console.log('Vanna response status:', vannaResponse.status);

    const responseText = await vannaResponse.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse JSON from Vanna. Response was:", responseText);
      return NextResponse.json(
        { error: "Received an invalid (non-JSON) response from the Vanna AI service.", details: responseText },
        { status: 500 }
      );
    }

    console.log('Vanna response data:', data);

    if (data.error) {
      return NextResponse.json(
        {
          question: data.question,
          sql: data.sql || '',
          results: data.results || { columns: [], data: [], row_count: 0 },
          error: data.error,
        },
        { status: 200 }
      );
    }

    if (!vannaResponse.ok) {
      return NextResponse.json(
        { error: 'Vanna AI service error' },
        { status: vannaResponse.status }
      );
    }

    return NextResponse.json({
      question: data.question,
      sql: data.sql,
      results: data.results,
      error: null,
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { 
        error: `Failed to process chat request: ${error.message}`,
        question: '',
        sql: '',
        results: { columns: [], data: [], row_count: 0 }
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Chat with Data API - Use POST to send queries',
      vannaApiUrl: VANNA_API_URL 
    },
    { status: 200 }
  );
}
