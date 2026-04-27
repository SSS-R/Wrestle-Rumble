import os
import uuid
from pathlib import Path
from fastapi import UploadFile

# Define storage directories inside the api app
UPLOADS_DIR = Path("uploads")
CARD_PHOTOS_DIR = UPLOADS_DIR / "cards"

# Ensure directories exist
CARD_PHOTOS_DIR.mkdir(parents=True, exist_ok=True)

async def _save_file_locally(file: UploadFile, directory: Path, subdir_name: str) -> str:
    """
    Saves a file locally with a unique name and returns the static URL.
    """
    try:
        # Generate unique filename
        # Preserve original extension
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        
        file_path = directory / unique_filename
        
        # Async read
        await file.seek(0)
        content = await file.read()
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(content)
            
        # Return URL (mapped to /uploads in main.py)
        # Note: Added host to URL when serving locally to ensure frontend can load it if they are on different ports
        return f"http://localhost:8000/uploads/{subdir_name}/{unique_filename}"
        
    except Exception as e:
        print(f"Error saving file locally: {e}")
        return None

async def save_card_photo(file: UploadFile) -> str:
    """
    Saves a card photo locally and returns the URL.
    """
    return await _save_file_locally(file, CARD_PHOTOS_DIR, "cards")

def delete_card_photo(photo_url: str):
    """
    Deletes the card photo from local storage.
    """
    if not photo_url:
        return
        
    try:
        # Check if URL belongs to our uploads
        if "/uploads/" in photo_url:
            # Extract relative path (e.g., from http://localhost:8000/uploads/cards/xxx.jpg)
            parts = photo_url.split("/uploads/")
            if len(parts) > 1:
                relative_path = parts[1]
                
                if ".." in relative_path:
                    print(f"Security Warning: Attempted directory traversal in delete: {photo_url}")
                    return
                    
                file_path = UPLOADS_DIR / relative_path
                
                if file_path.exists():
                    os.remove(file_path)
                    print(f"Deleted local file: {file_path}")
                else:
                    print(f"File not found for deletion: {file_path}")
    except Exception as e:
        print(f"Error deleting local file: {e}")
