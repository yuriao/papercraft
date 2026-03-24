import os, uuid, subprocess, traceback
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix='/figures', tags=['figures'])
UPLOAD_DIR = os.getenv('UPLOAD_DIR', './data/uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

class RunCodeRequest(BaseModel):
    code: str
    language: str = 'python'
    data_file: Optional[str] = None

@router.post('/run-code')
def run_panel_code(body: RunCodeRequest):
    if body.language != 'python':
        return {'error': 'Only Python supported server-side'}
    data_path = os.path.join(UPLOAD_DIR, body.data_file) if body.data_file else None
    wrapper = f'''
import sys, json
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np
data_file_path = {repr(data_path)}
{body.code}
if "fig" in dir():
    print("__PLOTLY__" + fig.to_json())
else:
    print("__ERROR__Assign your plot to a variable named fig")
'''
    try:
        r = subprocess.run(['python3', '-c', wrapper], capture_output=True, text=True, timeout=30)
        out = r.stdout.strip()
        if '__PLOTLY__' in out:
            return {'plotly_json': out.split('__PLOTLY__', 1)[1]}
        elif '__ERROR__' in out:
            return {'error': out.split('__ERROR__', 1)[1]}
        return {'error': r.stderr or 'No output. Assign your plot to fig.'}
    except subprocess.TimeoutExpired:
        return {'error': 'Timed out (30s limit)'}
    except Exception:
        return {'error': traceback.format_exc()}

@router.post('/upload-data')
async def upload_data(file: UploadFile = File(...)):
    fname = f'{uuid.uuid4()}_{file.filename}'
    path = os.path.join(UPLOAD_DIR, fname)
    content = await file.read()
    with open(path, 'wb') as f:
        f.write(content)
    return {'filename': fname, 'original_name': file.filename, 'size': len(content)}
