import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const origin=process.env.COMPENSATION_TEST_ORIGIN || 'http://127.0.0.1:5187';
const browser=await chromium.launch();
try {
 const page=await browser.newPage();
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!==origin)return route.abort();
  if(url.pathname==='/compensation-test') {
   const html=await (await page.request.get(origin+'/')).text();
   return route.fulfill({contentType:'text/html',body:html.replace('/src/index.tsx','/scripts/fixtures/worker-compensation.tsx')});
  }
  return route.continue();
 });
 await page.goto(origin+'/compensation-test');
 const method=page.getByLabel('Metodo compenso');
 await method.waitFor();
 assert.equal(await page.getByLabel('Quantità completata').count(),0);
 await method.selectOption('PER_UNIT');
 await page.getByLabel('Tariffa per unità').fill('12.5');
 await page.getByLabel('Unità di misura').fill('uffici');
 const quantity=page.getByLabel('Quantità completata');
 assert.equal(await quantity.getAttribute('required'),'');
 await quantity.fill('-1');
 assert.equal(await quantity.evaluate(el=>el.checkValidity()),false);
 await quantity.fill('2.5');
 await page.getByText('Save',{exact:true}).click();
 assert.deepEqual(await page.evaluate(()=>window.saved),{terms:{method:'PER_UNIT',unitRate:12.5,unitName:'uffici'},quantity:2.5});
 await page.setViewportSize({width:375,height:812});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 await method.selectOption('FIXED_PROJECT');
 assert.equal(await quantity.count(),0);
 await page.getByLabel('Compenso fisso progetto').fill('900');
 await page.getByText('Save',{exact:true}).click();
 assert.equal(await page.evaluate(()=>window.saved.terms.fixedAmount),900);
 await method.selectOption('HOURLY');
 assert.equal(await page.locator('input[type=number]').count(),0);
 console.log('PASS: actual compensation controls: hourly unchanged, unit quantities/decimal validation, fixed without quantity, mobile layout.');
}finally{await browser.close();}
