# BookVector Chroma

BookVector Chroma provides a workbench for uploading PDFs, inspecting chunks, searching sample vectors, generating quizzes, and exporting a VS Code project.

## Run locally

Prerequisites: Node.js and Python 3.

1. Install the frontend dependencies with `npm install`.
2. Install the API dependencies with `python -m pip install fastapi uvicorn python-multipart`.
3. Start the API from the project directory with `python -m uvicorn server:app --reload`.
4. In a second terminal, start the frontend with `npm run dev`.
5. Open the Vite URL printed in the frontend terminal.

The frontend proxies `/api` requests to `http://localhost:8000`. Uploading a PDF stores it through `POST /api/process-pdf`, then extracts its text in the browser. The current API does not yet run the Python PDF extraction, embedding, or ChromaDB pipeline; the other workbench features continue to use the existing client-side demo data and simulators.
