"""Browser-level rehearsal: joints, real audio, actor reuse and standalone export.
Run npm run dev first, and npm run build && npm run export for the offline check.
"""
import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright
BASE_URL=os.environ.get('TEST_URL','http://127.0.0.1:5715/')
OUTPUT=Path(os.environ.get('TEST_OUTPUT','test-results'));OUTPUT.mkdir(parents=True,exist_ok=True)
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1440,'height':1120},device_scale_factor=1)
  errors=[];image_requests=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda r:image_requests.append(r.url) if r.resource_type=='image' else None)
  await page.goto(BASE_URL+'?capture');await page.wait_for_function('window.__gwen',timeout=60000)
  assert len(await page.evaluate('__gwen.assets().parts'))==10
  await page.evaluate('__gwen.freeze(0)')
  body=await page.locator('[data-part="body"]').get_attribute('transform')
  await page.screenshot(path=str(OUTPUT/'actor-desktop.png'),full_page=True)
  await page.get_by_role('button',name='眨眼',exact=True).click()
  await page.wait_for_function('__gwen.rig.pose.blink>.8')
  assert await page.locator('[data-part="body"]').get_attribute('transform')==body
  await page.locator('.actor-stage').screenshot(path=str(OUTPUT/'actor-blink.png'))
  await page.evaluate('__gwen.freeze(0)')
  await page.get_by_role('button',name='歪头',exact=True).click()
  await page.wait_for_function('__gwen.rig.pose.head>8')
  assert await page.locator('[data-part="body"]').get_attribute('transform')==body
  assert await page.locator('[data-part="head"]').get_attribute('transform')==await page.locator('[data-part="hair"]').get_attribute('transform')
  await page.locator('.actor-stage').screenshot(path=str(OUTPUT/'actor-tilt.png'))
  await page.evaluate('__gwen.freeze(0)')
  await page.get_by_role('button',name='抬剪刀',exact=True).click()
  await page.wait_for_function('__gwen.rig.pose.raise>.98')
  distance=await page.evaluate('''()=>{
   const a=new DOMPoint(0,0).matrixTransform(document.querySelector('#scissor-grip').getScreenCTM());
   const b=new DOMPoint(4.32,149.28).matrixTransform(document.querySelector('#elbow-right').getScreenCTM());
   return Math.hypot(a.x-b.x,a.y-b.y);
  }''')
  assert distance<.1,distance
  images_before=len(image_requests)
  await page.evaluate('__gwen.selectTake(0)')
  await page.locator('#play-take').click()
  await page.wait_for_function('__gwen.rig.pose.open>.25 && __gwen.audio.currentTime>.4')
  assert '冠军皮肤' in await page.locator('#caption-text').inner_text()
  await page.locator('.actor-stage').screenshot(path=str(OUTPUT/'actor-speaking.png'))
  await page.get_by_role('button',name='暂停演出',exact=True).click()
  assert await page.evaluate('__gwen.audio.paused')
  await page.get_by_role('button',name='演出所选台词',exact=True).click()
  await page.wait_for_function('__gwen.audio.ended',timeout=20000)
  await page.evaluate('__gwen.selectTake(1)')
  await page.locator('#play-take').click()
  await page.wait_for_function('__gwen.rig.pose.raise>.9 && __gwen.audio.currentTime>1.2')
  assert '好好考虑' in await page.locator('#caption-text').inner_text()
  await page.wait_for_function('__gwen.audio.ended',timeout=20000)
  await page.wait_for_function('__gwen.audio.ended && Math.abs(__gwen.rig.pose.head)<.01 && __gwen.rig.pose.raise===0',timeout=3000)
  assert abs(await page.evaluate('__gwen.rig.pose.head'))<.01
  assert await page.evaluate('__gwen.rig.pose.raise')==0
  assert len(image_requests)==images_before, 'Changing takes loaded new artwork'
  await page.evaluate('__gwen.freeze(2.0)')
  await page.locator('.actor-stage').screenshot(path=str(OUTPUT/'actor-raised.png'))
  await page.locator('#exploded').check();await page.locator('#joints').check();await page.evaluate('__gwen.freeze(0)')
  assert await page.locator('svg.gwen-rig').evaluate('(el)=>el.classList.contains("show-joints")')
  await page.screenshot(path=str(OUTPUT/'actor-exploded.png'),full_page=True)
  await page.locator('#exploded').uncheck();await page.locator('#joints').uncheck()
  await page.set_viewport_size({'width':390,'height':844});await page.evaluate('__gwen.freeze(2.0)')
  await page.screenshot(path=str(OUTPUT/'actor-mobile.png'),full_page=True)
  assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  await page.locator('#mute').click();assert await page.evaluate('__gwen.audio.muted')
  await page.locator('#captions').click();assert await page.locator('#caption-text').inner_text()==''
  await page.get_by_role('button',name='说话',exact=True).click()
  await page.wait_for_function('!__gwen.audio.paused && __gwen.audio.currentTime>1.2')
  await page.get_by_role('button',name='歪头',exact=True).click()
  await page.get_by_role('button',name='抬剪刀',exact=True).click()
  await page.wait_for_function('__gwen.rig.pose.raise>.5 && __gwen.rig.pose.head>3')
  assert not await page.evaluate('__gwen.audio.paused')
  await page.evaluate('__gwen.audio.pause()')
  await page.emulate_media(reduced_motion='reduce');await page.reload();await page.wait_for_function('window.__gwen')
  await page.evaluate('__gwen.selectTake(1)');await page.evaluate('__gwen.freeze(2)')
  assert await page.evaluate('__gwen.rig.pose.raise')==0
  assert await page.evaluate('__gwen.rig.pose.head')==0
  standalone=await browser.new_page();offline_requests=[]
  standalone.on('pageerror',lambda e:errors.append(str(e)))
  async def offline_route(route):
   if route.request.resource_type=='document':await route.continue_()
   elif route.request.url.startswith(('data:','blob:')):await route.continue_()
   else:offline_requests.append(route.request.url);await route.abort()
  await standalone.route('**/*',offline_route)
  await standalone.goto(BASE_URL+'dist/gwen-actor.html?capture',timeout=60000)
  await standalone.wait_for_function('window.__gwen',timeout=60000)
  await standalone.locator('#play-take').click();await standalone.wait_for_function('__gwen.audio.currentTime>.5')
  assert not offline_requests,offline_requests
  assert not errors,errors
  print(json.dumps({'parts':10,'takePlayback':'both completed','gripDriftPx':distance,'artworkReused':True,'mobileOverflow':False,'standaloneExternalRequests':offline_requests,'browserErrors':errors}))
  await browser.close()
asyncio.run(main())
