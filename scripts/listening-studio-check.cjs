const {chromium,expect}=require('@playwright/test')
const fs=require('node:fs/promises')
const assert=require('node:assert/strict')
const WEB='http://localhost:3000'

async function main(){
  const browser=await chromium.launch({channel:'chrome',headless:true})
  const page=await browser.newPage({viewport:{width:1440,height:1000}})
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  const checks=[]
  try{
    await page.goto(WEB+'/login')
    await page.getByLabel('Email',{exact:true}).fill('mira@groovy.demo')
    await page.getByLabel('Password',{exact:true}).fill('listening123')
    await page.locator('#main-content').getByRole('button',{name:'Sign in',exact:true}).click()
    await page.waitForURL('**/dashboard')
    await expect(page.locator('.studio-metric')).toHaveCount(4)
    await expect(page.locator('.import-audio-widget')).toHaveCount(0)
    await expect(page.locator('.dashboard-studio input[type="file"]')).toHaveCount(0)
    const creatorLink=page.getByRole('link',{name:'Open creator workspace',exact:true})
    await expect(creatorLink).toHaveAttribute('href','/creator')
    await creatorLink.click()
    await page.waitForURL('**/creator')
    await page.getByRole('link',{name:'Upload a book',exact:true}).click()
    await page.waitForURL('**/upload')
    await expect(page.getByRole('heading',{name:'Upload a book.',exact:true})).toBeVisible()
    await page.getByRole('button',{name:'Add chapter',exact:true}).click()
    const names=page.getByRole('textbox',{name:'Chapter name',exact:true})
    await expect(names).toHaveCount(2)
    await names.nth(0).fill('Opening')
    await names.nth(1).fill('Next chapter')
    await page.getByRole('button',{name:'Move chapter up',exact:true}).nth(1).click()
    await expect(names.nth(0)).toHaveValue('Next chapter')
    await expect(names.nth(1)).toHaveValue('Opening')
    checks.push('Dashboard uses creator workspace and existing chapter naming/reordering upload flow')
    await page.goto(WEB+'/library')
    await page.locator('.studio-shelf-card').first().waitFor()
    await expect(page.locator('.library-studio-overview').getByRole('link',{name:'Upload a book',exact:true})).toHaveAttribute('href','/creator')
    await expect(page.locator('.library-studio a[href="/local"]')).toHaveCount(0)
    const total=await page.locator('.studio-shelf-card').count()
    assert.ok(total>0)
    await page.getByRole('button',{name:'List view',exact:true}).click()
    await expect(page.locator('.studio-shelf-grid')).toHaveClass(/is-list-view/)
    await page.getByRole('button',{name:'Grid view',exact:true}).click()
    await expect(page.locator('.studio-shelf-grid')).not.toHaveClass(/is-list-view/)
    await page.getByLabel('Search titles, authors, narrators...',{exact:true}).fill('Alice')
    await expect(page.locator('.studio-shelf-card')).toHaveCount(1)
    await page.locator('.studio-shelf-card summary').click()
    await expect(page.getByLabel("Status for Alice's Adventures in Wonderland",{exact:true})).toBeVisible()
    await expect(page.getByLabel('Add to book collection',{exact:true})).toBeVisible()
    await expect(page.getByRole('button',{name:'Remove from library',exact:true})).toBeVisible()
    checks.push('Library grid/list views, search and accessible book management controls')
    for(const theme of ['dark','light']){
      await page.evaluate(value=>{localStorage.setItem('groovy-theme',value);document.documentElement.setAttribute('data-theme',value)},theme)
      for(const width of [390,768,1024,1440]){
        await page.setViewportSize({width,height:1000})
        for(const route of ['/library','/dashboard']){
          await page.goto(WEB+route)
          await page.locator('#main-content h1').waitFor()
          await page.locator(route==='/library'?'.studio-shelf-card':'.studio-metric').first().waitFor()
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${theme} ${width} ${route}`)
          const overflow=await page.locator('#main-content').evaluate(element=>element.scrollWidth>element.clientWidth+2)
          assert.equal(overflow,false,`Main content overflow: ${theme} ${width} ${route}`)
          const palette=await page.locator(route==='/dashboard'?'.dashboard-studio':'.library-studio').evaluate(root=>{
            const style=getComputedStyle(root)
            const goal=root.querySelector('.studio-goal-ring')
            return {accent:style.getPropertyValue('--studio-accent').trim(),workspaceAccent:style.getPropertyValue('--workspace-accent').trim(),hero:getComputedStyle(root.querySelector('.studio-hero')).backgroundColor,button:getComputedStyle(root.querySelector('.studio-button')).backgroundColor,metrics:[...root.querySelectorAll('.studio-metric-icon')].map(icon=>getComputedStyle(icon).color),goal:goal?getComputedStyle(goal).backgroundImage:null,selected:root.querySelector('.library-status-pills>button.selected')?getComputedStyle(root.querySelector('.library-status-pills>button.selected')).backgroundColor:null}
          })
          if(route==='/library'){
            const purple=theme==='dark'?'rgb(194, 181, 255)':'rgb(102, 80, 181)'
            assert.equal(palette.accent,palette.workspaceAccent)
            assert.equal(palette.accent,theme==='dark'?'#c2b5ff':'#6650b5')
            assert.equal(palette.hero,theme==='dark'?'rgb(23, 23, 23)':'rgb(255, 255, 255)')
            assert.equal(palette.button,purple)
            assert.ok(palette.metrics.every(color=>color===purple))
            if(palette.goal)assert.ok(palette.goal.includes(purple))
            if(palette.selected)assert.equal(palette.selected,purple)
          } else {
            assert.equal(await page.locator('.studio-metric').count(),4)
            assert.equal(palette.hero,'rgb(17, 17, 17)')
          }
          if(width===390||width===1440)await page.screenshot({path:'artifacts/'+route.slice(1)+'-'+theme+'-'+width+'.png'})
        }
      }
    }
    checks.push('Library and dashboard: dark/light layouts at 390, 768, 1024 and 1440px without overflow; shared black/white/purple palette matching workspace colors')
    assert.deepEqual(errors,[])
    await fs.writeFile('artifacts/listening-studio-check.json',JSON.stringify({checks,errors,passedAt:new Date().toISOString()},null,2))
    console.log(checks.map(check=>'PASS '+check).join('\n'))
  }finally{await browser.close()}
}
main().catch(error=>{console.error(error);process.exit(1)})
