"""Reuse two existing voice lines without another TTS generation.
Requires FFmpeg and NumPy. Run from any directory.
"""
from pathlib import Path
import json, subprocess
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'takes.json').read_text())
rate=24000
original=np.frombuffer(subprocess.check_output(['ffmpeg','-loglevel','error','-i',str(ROOT/'assets/dialogue.mp3'),'-f','f32le','-ar',str(rate),'-ac','1','-']),dtype='<f4')
for take in data['takes']:
    start,end=take['source']
    delay=round(take['speech'][0]*rate)
    track=np.zeros(round(data['duration']*rate),dtype='<f4')
    phrase=original[round(start*rate):round(end*rate)]
    track[delay:delay+len(phrase)]=phrase
    output=ROOT/take['audio']
    # Construct the exact sample count before encoding; trim/delay filter timestamps
    # can otherwise make the output shorter than the director's action timeline.
    subprocess.run(['ffmpeg','-y','-loglevel','error','-f','f32le','-ar',str(rate),'-ac','1','-i','pipe:0',
        '-c:a','libmp3lame','-b:a','96k',str(output)],input=track.tobytes(),check=True)
    raw=subprocess.check_output(['ffmpeg','-loglevel','error','-i',str(output),'-f','f32le','-ar','24000','-ac','1','-'])
    pcm=np.frombuffer(raw,dtype='<f4')
    envelope=[round(min(1,float(np.sqrt(np.mean(pcm[i:i+600]**2)))*7),4) for i in range(0,len(pcm),600)]
    (ROOT/take['envelope']).write_text(json.dumps(envelope))
    print(f'{take["id"]}: reused {end-start:.2f}s of existing voice')
