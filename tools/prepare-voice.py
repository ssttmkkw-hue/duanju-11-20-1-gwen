"""Offline Mandarin voices; pass extracted vits-icefall-zh-aishell3 directory.
Requires sherpa-onnx, numpy and ffmpeg. No voice cloning is used.
"""
import json, subprocess, sys, tempfile, wave
from pathlib import Path
import numpy as np
import sherpa_onnx as sherpa

ROOT = Path(__file__).resolve().parents[1]
model = Path(sys.argv[1])
tts = sherpa.OfflineTts(sherpa.OfflineTtsConfig(model=sherpa.OfflineTtsModelConfig(
    vits=sherpa.OfflineTtsVitsModelConfig(model=str(model/'model.onnx'),
        tokens=str(model/'tokens.txt'), lexicon=str(model/'lexicon.txt'),
        noise_scale=.43, noise_scale_w=.45), num_threads=2)))
story = json.loads((ROOT/'story.json').read_text())
rate = tts.sample_rate
track = np.zeros(round(story['duration']*rate), dtype=np.float32)
levels = []
with tempfile.TemporaryDirectory() as folder:
    for i, line in enumerate(story['lines']):
        audio = tts.generate(line['spoken'], sid=6 if line['actor']=='gwen' else 10, speed=1.02)
        pcm = np.array(audio.samples)
        active = np.flatnonzero(np.abs(pcm) > max(.003, np.abs(pcm).max()*.018))
        if not len(active): raise ValueError('Empty speech')
        pcm = pcm[max(0,active[0]-int(.02*rate)):active[-1]+int(.04*rate)]
        pcm *= min(2.5, .82/max(.01,np.abs(pcm).max()))
        raw = Path(folder)/f'{i}.wav'
        def write_wav(path, samples):
            with wave.open(str(path),'wb') as wav:
                wav.setparams((1,2,rate,0,'NONE','not compressed'))
                wav.writeframes((np.clip(samples,-1,1)*32767).astype('<i2').tobytes())
        write_wav(raw,pcm)
        # Fit speech to the director's fixed slots without changing its pitch.
        target = line['end']-line['start']-.06
        factor = max(.88, len(pcm)/rate/target)
        fitted = Path(folder)/f'{i}-fit.wav'
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(raw),'-af',
            f'atempo={factor:.5f},afade=t=in:d=0.012,afade=t=out:st={target-.025}:d=0.025',
            str(fitted)],check=True)
        with wave.open(str(fitted),'rb') as wav:
            pcm = np.frombuffer(wav.readframes(wav.getnframes()),dtype='<i2').astype(np.float32)/32768
        start = round(line['start']*rate)
        length=min(len(pcm),len(track)-start)
        track[start:start+length] += pcm[:length]
        print(f"{line['name']}: {len(pcm)/rate:.2f}s, tempo {factor:.2f}",flush=True)
    master=Path(folder)/'master.wav'
    write_wav(master,track)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(master),'-ar','24000',
        '-c:a','libmp3lame','-b:a','96k',str(ROOT/'assets/dialogue.mp3')],check=True)
    for t in np.arange(0,story['duration'],.025):
        frame=track[round(t*rate):round((t+.025)*rate)]
        levels.append(round(min(1,float(np.sqrt(np.mean(frame**2)))*7),3))
    (ROOT/'assets/voice-envelope.json').write_text(json.dumps(levels))
