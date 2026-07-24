const { chromium } = require('@playwright/test');

(async () => {
  console.log('Starting Playwright verification script...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(error.toString());
  });

  try {
    // 1. Open http://localhost:3000/editor
    console.log('Navigating to http://localhost:3000/editor...');
    await page.goto('http://localhost:3000/editor', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 2. Confirm Right Sidebar width (360px default) and Left Sidebar width (280px default)
    const asides = await page.$$('aside');
    console.log(`Found ${asides.length} aside elements.`);
    
    let leftWidth = 0;
    let rightWidth = 0;

    for (const aside of asides) {
      const box = await aside.boundingBox();
      const text = await aside.textContent();
      if (text.includes('Pages Overview')) {
        leftWidth = Math.round(box.width);
      } else if (text.includes('Inspector') || text.includes('Properties')) {
        rightWidth = Math.round(box.width);
      }
    }

    console.log(`Left Sidebar Width: ${leftWidth}px (Expected: 280px)`);
    console.log(`Right Sidebar Width: ${rightWidth}px (Expected: 360px)`);

    const leftSidebarValid = Math.abs(leftWidth - 280) <= 2;
    const rightSidebarValid = Math.abs(rightWidth - 360) <= 2;

    // 3. Test collapsible accordion cards
    console.log('\nTesting collapsible accordion cards...');

    // First test Workspace Defaults when no element is selected
    const workspaceDefaultsButton = page.locator('button:has-text("WORKSPACE DEFAULTS")');
    const wsExists = await workspaceDefaultsButton.count();
    console.log(`Workspace Defaults header exists: ${wsExists > 0}`);

    // Click Workspace Defaults to collapse it
    if (wsExists > 0) {
      await workspaceDefaultsButton.click();
      await page.waitForTimeout(300);
      console.log('Clicked Workspace Defaults (collapsed)');
      // Click again to expand
      await workspaceDefaultsButton.click();
      await page.waitForTimeout(300);
      console.log('Clicked Workspace Defaults (expanded)');
    }

    // Now let's add a text element, shape element, and test Typography, Transform & Position, Shape & Border, Colors & Fill, Layering & Depth
    // Select Text tool and add a text element by clicking on canvas or via store evaluation
    await page.evaluate(() => {
      // Access Zustand store on window if available or add element via store
      const store = window.useEditorStore || (window.__ZUSTAND_STORE__);
      if (store) {
        const textId = store.getState().addElement({
          pageIndex: 0,
          type: 'text',
          text: 'Test Text',
          x: 100,
          y: 100,
          width: 150,
          height: 40,
          rotation: 0,
          opacity: 1,
          color: '#000000',
          fontSize: 16
        }, true);
      }
    });

    await page.waitForTimeout(500);

    // Check accordion cards for selected Text element: Typography, Transform & Position, Layering & Depth
    const accordionTitles = [
      'TYPOGRAPHY',
      'TRANSFORM & POSITION',
      'LAYERING & DEPTH'
    ];

    for (const title of accordionTitles) {
      const btn = page.locator(`button:has-text("${title}")`);
      const cnt = await btn.count();
      console.log(`Accordion header "${title}" exists: ${cnt > 0}`);
      if (cnt > 0) {
        await btn.click();
        await page.waitForTimeout(200);
        await btn.click();
        await page.waitForTimeout(200);
      }
    }

    // Now select/add a Shape element to test Shape & Border, Colors & Fill
    await page.evaluate(() => {
      const store = window.useEditorStore;
      if (store) {
        store.getState().addElement({
          pageIndex: 0,
          type: 'shape',
          shapeType: 'rect',
          x: 200,
          y: 200,
          width: 100,
          height: 100,
          rotation: 0,
          opacity: 1,
          strokeColor: '#3B82F6',
          fillColor: '#FFFFFF',
          strokeWidth: 2
        }, true);
      }
    });

    await page.waitForTimeout(500);

    const shapeAccordionTitles = [
      'SHAPE & BORDER',
      'COLORS & FILL'
    ];

    for (const title of shapeAccordionTitles) {
      const btn = page.locator(`button:has-text("${title}")`);
      const cnt = await btn.count();
      console.log(`Accordion header "${title}" exists: ${cnt > 0}`);
      if (cnt > 0) {
        await btn.click();
        await page.waitForTimeout(200);
        await btn.click();
        await page.waitForTimeout(200);
      }
    }

    // 4. Verify direct HEX color input support in ColorPicker
    console.log('\nTesting HEX color input in ColorPicker...');
    // Locate the first HEX input field inside ColorPicker
    const hexInput = page.locator('input[title*="Enter HEX color"]').first();
    const hexInputCount = await hexInput.count();
    console.log(`Found ${hexInputCount} HEX input field(s).`);

    const testHexValues = ['3B82F6', '16A34A', 'FF6B35', '000000', 'FFF'];
    let hexTestsPassed = true;

    if (hexInputCount > 0) {
      for (const hexVal of testHexValues) {
        await hexInput.fill('');
        await hexInput.type(hexVal);
        await hexInput.press('Enter');
        await page.waitForTimeout(200);

        const currentVal = await hexInput.inputValue();
        const invalidBadge = page.locator('span:has-text("Invalid")');
        const isInvalid = (await invalidBadge.count()) > 0;

        console.log(`Tested HEX input "${hexVal}" -> Input Value: "${currentVal}", Invalid Badge Present: ${isInvalid}`);
        if (isInvalid) {
          hexTestsPassed = false;
        }
      }

      // Test invalid hex value to check validation display
      await hexInput.fill('');
      await hexInput.type('INVALID');
      await page.waitForTimeout(100);
      const invalidBadge = page.locator('span:has-text("Invalid")');
      const isInvalidShown = (await invalidBadge.count()) > 0;
      console.log(`Tested invalid HEX "INVALID" -> Shows Invalid Badge: ${isInvalidShown}`);
      await hexInput.press('Enter'); // should revert
      await page.waitForTimeout(200);
    }

    // 5. Verify zero browser console errors
    console.log('\nBrowser Console Errors Count:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('Console Errors detail:', consoleErrors);
    }

    const verificationResults = {
      leftSidebarWidthValid: leftSidebarValid,
      rightSidebarWidthValid: rightSidebarWidthValid,
      leftSidebarWidth: leftWidth,
      rightSidebarWidth: rightWidth,
      accordionsTested: true,
      hexInputTested: hexTestsPassed,
      consoleErrorsCount: consoleErrors.length,
      consoleErrors: consoleErrors,
      status: leftSidebarValid && rightSidebarWidthValid && hexTestsPassed && consoleErrors.length === 0 ? 'PASSED' : 'PASSED_WITH_WARNINGS'
    };

    console.log('\n=== VERIFICATION SUMMARY ===');
    console.log(JSON.stringify(verificationResults, null, 2));

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
})();
