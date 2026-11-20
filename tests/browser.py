import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright
BASE_URL = os.environ.get('TEST_URL', 'http://127.0.0.1:5715/')
OUTPUT = Path(os.environ.get('TEST_OUTPUT', 'test-results'))
OUTPUT.mkdir(parents=True, exist_ok=True)
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1440,'height':1080},device_scale_factor=1)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(BASE_URL + '?capture')
  await page.wait_for_function('window.__drama && document.querySelectorAll(".chapter").length===4')
  await page.screenshot(path=str(OUTPUT/'gwen-desktop.png'),full_page=True)
  await page.get_by_role('button',name='播放 20 秒短剧',exact=True).click()
  await page.wait_for_timeout(1200)
  state=await page.evaluate('({time:__drama.audio.currentTime,paused:__drama.audio.paused,ready:__drama.audio.readyState})')
  assert state['time']>.5 and not state['paused'],state
  await page.get_by_role('button',name='暂停短剧',exact=True).first.click()
  await page.evaluate('__drama.seek(10.7)')
  assert await page.locator('#speaker').inner_text()=='Bin'
  await page.get_by_role('button',name='关闭字幕',exact=True).click()
  assert await page.locator('#dialogue').inner_text()==''
  await page.get_by_role('button',name='开启字幕',exact=True).click()
  await page.evaluate('__drama.seek(12.8)')
  assert '不选我的话' in await page.locator('#dialogue').inner_text()
  await page.screenshot(path=str(OUTPUT/'gwen-shot3.png'),full_page=True)
  await page.evaluate('__drama.seek(19.8)')
  assert 'show' in await page.locator('#end-title').get_attribute('class')
  await page.get_by_role('button',name='从头重播',exact=True).click()
  await page.wait_for_timeout(250)
  assert await page.evaluate('__drama.audio.currentTime')<1
  await page.get_by_role('button',name='静音',exact=True).click()
  assert await page.evaluate('__drama.audio.muted')
  await page.evaluate('__drama.audio.pause()')
  await page.locator('.chapter').nth(1).click()
  assert await page.locator('#screen').get_attribute('data-shot')=='1'
  await page.set_viewport_size({'width':390,'height':844})
  await page.evaluate('__drama.seek(17.8)')
  await page.screenshot(path=str(OUTPUT/'gwen-mobile.png'),full_page=True)
  assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  await page.emulate_media(reduced_motion='reduce')
  await page.reload()
  await page.wait_for_function('window.__drama')
  await page.evaluate('__drama.seek(6)')
  assert await page.locator('#picture').evaluate('(el)=>el.style.transform')=='scale(1.025)'
  assert not errors,errors
  print(json.dumps({'playback':state,'browserErrors':errors,'mobileOverflow':False,'checks':'play, pause, seek, subtitles, mute, replay, chapters, end title, reduced motion passed'}))
  await browser.close()
asyncio.run(main())
