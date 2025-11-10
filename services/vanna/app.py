from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import psycopg2
from groq import Groq
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="Vanna AI Service")

# CORS setup for local development and Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Vanna with Groq
class VannaGroq:
    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.db_url = os.getenv("DATABASE_URL")
        # Use a supported Groq model
        # Options: llama-3.3-70b-versatile, llama-3.1-70b-versatile, mixtral-8x7b-32768-v0.1
        self.model = "llama-3.3-70b-versatile"
        logger.info(f"Initialized VannaGroq with model: {self.model}")
        
    def connect_to_db(self):
        """Connect to Neon Postgres database"""
        try:
            conn = psycopg2.connect(self.db_url)
            logger.info("Database connection successful")
            return conn
        except Exception as e:
            logger.error(f"DB connection failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"DB connection failed: {str(e)}")
    
    def get_schema_info(self):
        """Get database schema for context"""
        conn = self.connect_to_db()
        cursor = conn.cursor()
        
        try:
            # Get all tables
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            tables = cursor.fetchall()
            
            schema_info = []
            for (table_name,) in tables:
                cursor.execute(f"""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = '{table_name}'
                """)
                columns = cursor.fetchall()
                schema_info.append({
                    "table": table_name,
                    "columns": [{"name": col[0], "type": col[1]} for col in columns]
                })
            
            logger.info(f"Retrieved schema for {len(schema_info)} tables")
            cursor.close()
            conn.close()
            return schema_info
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"Schema retrieval failed: {str(e)}")
            raise
    
    def generate_sql(self, question: str):
        """Generate SQL using Groq LLM"""
        logger.info(f"Generating SQL for question: {question}")
        schema = self.get_schema_info()
        
        # Build schema context
        schema_parts = []
        for table in schema:
            columns_str = ', '.join([f"{col['name']} ({col['type']})" for col in table['columns']])
            schema_parts.append(f"Table: {table['table']}\nColumns: {columns_str}\n")
        
        schema_text = "\n".join(schema_parts)
        
        prompt = f"""You are a SQL expert. Given the following database schema, generate a PostgreSQL query to answer the user's question.

Database Schema:
{schema_text}

User Question: {question}

Return ONLY the SQL query, no explanations. Use proper PostgreSQL syntax.

SQL Query:"""

        try:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a SQL expert that generates PostgreSQL queries."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=500
            )
            
            sql = response.choices[0].message.content.strip()
            # Clean up SQL (remove markdown code blocks if present)
            sql = sql.replace("```sql", "").replace("```", "").strip()
            logger.info(f"Generated SQL: {sql}")
            return sql
            
        except Exception as e:
            logger.error(f"SQL generation failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"SQL generation failed: {str(e)}")
    
    def execute_sql(self, sql: str):
        """Execute SQL and return results"""
        logger.info(f"Executing SQL: {sql}")
        conn = self.connect_to_db()
        cursor = conn.cursor()
        
        try:
            cursor.execute(sql)
            
            # Get column names
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            
            # Fetch results
            rows = cursor.fetchall()
            
            # Convert to list of dicts
            results = [dict(zip(columns, row)) for row in rows]
            
            cursor.close()
            conn.close()
            
            logger.info(f"SQL executed successfully. Returned {len(results)} rows")
            
            return {
                "columns": columns,
                "data": results,
                "row_count": len(results)
            }
            
        except Exception as e:
            cursor.close()
            conn.close()
            logger.error(f"SQL execution failed: {str(e)}")
            raise HTTPException(status_code=400, detail=f"SQL execution failed: {str(e)}")

# Initialize Vanna
vanna = VannaGroq()

# Request/Response models
class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    question: str
    sql: str
    results: dict
    error: str | None = None

@app.get("/")
def read_root():
    return {"status": "Vanna AI Service Running", "version": "1.0"}

@app.get("/health")
def health_check():
    try:
        # Test database connection
        conn = vanna.connect_to_db()
        conn.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

@app.post("/query", response_model=ChatResponse)
def chat_query(request: ChatRequest):
    """
    Main endpoint to process natural language queries
    """
    logger.info(f"Received query request: {request.question}")
    
    try:
        # Generate SQL
        sql = vanna.generate_sql(request.question)
        
        # Execute SQL
        results = vanna.execute_sql(sql)
        
        response = ChatResponse(
            question=request.question,
            sql=sql,
            results=results,
            error=None
        )
        
        logger.info(f"Query successful. Returning {results['row_count']} rows")
        return response
        
    except HTTPException as he:
        logger.error(f"HTTPException: {he.detail}")
        return ChatResponse(
            question=request.question,
            sql="",
            results={"columns": [], "data": [], "row_count": 0},
            error=str(he.detail)
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return ChatResponse(
            question=request.question,
            sql="",
            results={"columns": [], "data": [], "row_count": 0},
            error=f"Unexpected error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    logger.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)