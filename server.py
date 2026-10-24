from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil

app = FastAPI()

app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:5173"],  # Vite's default port
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.post("/api/process-pdf")
async def process_pdf(file: UploadFile = File(...)):
	path = f"books/{file.filename}"
	with open(path, "wb") as f:
		shutil.copyfileobj(file.file, f)

	# Call your existing logic from extract_pdf.py here, e.g.:
	# result = your_function(path)
	return {"status": "ok", "filename": file.filename}
