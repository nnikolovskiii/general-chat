import os
import aiohttp
import asyncio
import uuid
import time
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, HTTPException
from fastapi.responses import StreamingResponse

from accounting_agent.models import User
from accounting_agent.models.file import File, ProcessingStatus
from accounting_agent.api.routes.auth import get_current_user
from accounting_agent.container import container
from accounting_agent.utils.file_processor import process_file, poll_for_results
from aiohttp import ClientTimeout


router = APIRouter()

# External file service URL
FILE_SERVICE_URL = "http://files_app:5001"

def generate_unique_filename(original_filename: str) -> str:
    """
    Generate a unique filename for storage while preserving the file extension.

    Args:
        original_filename: The original filename provided by the user

    Returns:
        A unique filename that can be safely used in URLs and paths
    """
    # Extract the file extension if it exists
    if '.' in original_filename:
        extension = original_filename.rsplit('.', 1)[1].lower()
    else:
        extension = ""

    # Generate a unique identifier using timestamp and UUID
    unique_id = f"{int(time.time())}_{uuid.uuid4().hex}"

    # Create the unique filename with the original extension
    if extension:
        unique_filename = f"{unique_id}.{extension}"
    else:
        unique_filename = unique_id

    return unique_filename

@router.post("/upload")
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a file to the external file service and save the metadata to the database.
    """
    try:
        # Generate a unique filename for storage
        unique_filename = generate_unique_filename(file.filename)
        timeout = ClientTimeout(total=300)

        async with aiohttp.ClientSession(timeout=timeout) as session:
            form = aiohttp.FormData()
            form.add_field('file',
                           await file.read(),  # <--- READ the file content here and pass it as bytes
                           filename=unique_filename,
                           content_type=file.content_type)

            # Reset the file pointer in case you need to use it again (good practice)
            await file.seek(0)

            # Add the password header
            headers = {
                'password': os.getenv("UPLOAD_PASSWORD") 
            }

            async with session.post(f"{FILE_SERVICE_URL}/test/upload", 
                                data=form, 
                                headers=headers) as response:
                if response.status != 200:
                    raise HTTPException(status_code=response.status, 
                                       detail="Failed to upload file to external service")

                result = await response.json()

        # Create file record in database
        file_record = File(
            user_id=current_user.email,
            url=f"{FILE_SERVICE_URL}/test/download/{unique_filename}",  # Use unique filename in URL
            filename=file.filename,  # Store original filename
            unique_filename=unique_filename,  # Store unique filename
            content_type=file.content_type
        )

        # Save to database
        mdb = container.mdb()
        id = await mdb.add_entry(file_record)
        file_record.id = id
        # Start processing the file with the agent
        asyncio.create_task(process_file(file_record))

        return {
            "status": "success",
            "message": "File uploaded successfully and sent for processing",
            "data": {
                "filename": file.filename,
                "unique_filename": file_record.unique_filename,
                "url": file_record.url,
                "processing_status": file_record.processing_status
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@router.get("/files")
async def get_files(
    current_user: User = Depends(get_current_user),
    status: Optional[ProcessingStatus] = None
):
    """
    Get all files for the current user.
    Optionally filter by processing status.
    """
    try:
        mdb = container.mdb()

        # Build the filter
        doc_filter = {"user_id": current_user.email}
        if status:
            doc_filter["processing_status"] = status

        files = await mdb.get_entries(
            class_type=File,
            doc_filter=doc_filter
        )

        # Format the response
        file_data = []
        for file in files:
            file_info = {
                "filename": file.filename,
                "unique_filename": file.unique_filename,
                "url": file.url,
                "content_type": file.content_type,
                "processing_status": file.processing_status,
                "thread_id": file.thread_id,
                "run_id": file.run_id
            }

            # Only include processing_result if it exists and status is COMPLETED or FAILED
            if file.processing_result and file.processing_status in [ProcessingStatus.COMPLETED, ProcessingStatus.FAILED]:
                file_info["processing_result"] = file.processing_result

            file_data.append(file_info)

        return {
            "status": "success",
            "message": "Files retrieved successfully",
            "data": file_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving files: {str(e)}")

@router.post("/process")
async def process_files(
    current_user: User = Depends(get_current_user),
    filenames: Optional[List[str]] = None
):
    """
    Process files that haven't been processed yet.
    If filenames is provided, only process those files.
    Otherwise, process all unprocessed files for the user.
    """
    try:
        mdb = container.mdb()

        # Build the filter
        doc_filter = {"user_id": current_user.email}
        if filenames:
            doc_filter["filename"] = {"$in": filenames}
        else:
            doc_filter["processing_status"] = ProcessingStatus.PENDING

        # Get files to process
        files_to_process = await mdb.get_entries(
            class_type=File,
            doc_filter=doc_filter
        )

        if not files_to_process:
            return {
                "status": "success",
                "message": "No files to process",
                "data": {"processed_count": 0}
            }

        # Process each file
        for file_record in files_to_process:
            asyncio.create_task(process_file(file_record))

        return {
            "status": "success",
            "message": f"Started processing {len(files_to_process)} files",
            "data": {
                "processed_count": len(files_to_process),
                "files": [{"filename": file.filename, "unique_filename": file.unique_filename} for file in files_to_process]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")

@router.get("/status/{unique_filename}")
async def get_file_status(
    unique_filename: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get the processing status and results of a file using its unique filename.
    """
    try:
        # Check if the file exists and belongs to the user
        mdb = container.mdb()
        file_records = await mdb.get_entries(
            class_type=File,
            doc_filter={"user_id": current_user.email, "unique_filename": unique_filename}
        )

        if not file_records:
            raise HTTPException(status_code=404, detail="File not found or you don't have permission to access it")

        file_record = file_records[0]

        return {
            "status": "success",
            "message": "File status retrieved successfully",
            "data": {
                "filename": file_record.filename,  # Return original filename for display
                "unique_filename": file_record.unique_filename,
                "processing_status": file_record.processing_status,
                "processing_result": file_record.processing_result
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving file status: {str(e)}")

@router.post("/poll/{unique_filename}")
async def poll_file_results(
    unique_filename: str,
    current_user: User = Depends(get_current_user)
):
    """
    Manually poll for results of a processed file using its unique filename.
    """
    try:
        # Check if the file exists and belongs to the user
        mdb = container.mdb()
        file_records = await mdb.get_entries(
            class_type=File,
            doc_filter={"user_id": current_user.email, "unique_filename": unique_filename}
        )

        if not file_records:
            raise HTTPException(status_code=404, detail="File not found or you don't have permission to access it")

        file_record = file_records[0]

        # Check if the file is in a state that can be polled
        if file_record.processing_status != ProcessingStatus.PROCESSING:
            return {
                "status": "error",
                "message": f"File is not in processing state. Current status: {file_record.processing_status}",
                "data": {
                    "filename": file_record.filename,
                    "unique_filename": file_record.unique_filename,
                    "processing_status": file_record.processing_status
                }
            }

        # Start polling for results
        asyncio.create_task(poll_for_results(file_record))

        return {
            "status": "success",
            "message": "Started polling for results",
            "data": {
                "filename": file_record.filename,
                "unique_filename": file_record.unique_filename,
                "processing_status": file_record.processing_status
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error polling for results: {str(e)}")

@router.get("/download/{unique_filename}")
async def download_file(
    unique_filename: str,
    current_user: User = Depends(get_current_user)
):
    """
    Download a file from the external file service using its unique filename.
    """
    try:
        # Check if the file exists and belongs to the user
        mdb = container.mdb()
        file_records = await mdb.get_entries(
            class_type=File,
            doc_filter={"user_id": current_user.email, "unique_filename": unique_filename}
        )

        if not file_records:
            raise HTTPException(status_code=404, detail="File not found or you don't have permission to access it")

        file_record = file_records[0]

        # Download file from external service
        async with aiohttp.ClientSession() as session:
            async with session.get(file_record.url) as response:
                if response.status != 200:
                    raise HTTPException(status_code=response.status, 
                                       detail="Failed to download file from external service")

                # Create a streaming response
                content = await response.read()

                # Use the original filename in the Content-Disposition header for the downloaded file
                return StreamingResponse(
                    iter([content]),
                    media_type=file_record.content_type or "application/octet-stream",
                    headers={"Content-Disposition": f"attachment; filename=\"{file_record.filename}\""}
                )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(e)}")
