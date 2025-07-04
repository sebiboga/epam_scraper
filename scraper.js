const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.setViewport({ width: 1200, height: 900 });
  await page.goto('https://www.epam.com/careers/job-listings?country=Romania', { waitUntil: 'networkidle2' });

  // Print page title and URL for sanity check
  console.log('Page loaded:', await page.title(), await page.url());

  // Print first 500 characters of page content to debug structure
  const contentSnippet = await page.content();
  console.log('Page content snippet:', contentSnippet.slice(0, 500));

  // Function to click "View More" button if exists
  async function clickViewMore(times = 3) {
    for (let i = 0; i < times; i++) {
      try {
        // Print all links text on page to see if "View More" exists
        const allLinksText = await page.$$eval('a', links => links.map(a => a.textContent.trim()));
        console.log('All <a> texts on page:', allLinksText);

        // Wait for the "View More" button to appear (timeout 3s)
        await page.waitForSelector('section > a.button--primary', { timeout: 3000 });
        const button = await page.$('section > a.button--primary');

        if (!button) {
          console.log('No more "View More" button found.');
          break;
        }

        console.log('Clicking "View More" button...');
        await button.click();

        // Wait for new jobs to load (adjust timeout as needed)
        await page.waitForTimeout(3000);
      } catch (e) {
        console.log('No "View More" button found or timeout reached.');
        break;
      }
    }
  }

  await clickViewMore();

  // Try alternative selectors for job listings container
  const possibleSelectors = [
    'section.job-listings',
    'div.job-listings',
    'section.jobs-list',
    'div.jobs-list',
    'section > div > a.job-listing',
    'a.job-listing'
  ];

  let containerFound = false;
  for (const sel of possibleSelectors) {
    try {
      await page.waitForSelector(sel, { timeout: 3000 });
      console.log(`Found job listings container with selector: "${sel}"`);
      containerFound = true;
      break;
    } catch (e) {
      // Not found, try next
    }
  }

  if (!containerFound) {
    console.error('Could not find job listings container with any known selector.');
    // Print page content snippet again for debugging
    const fullContent = await page.content();
    console.log('Full page content snippet:', fullContent.slice(0, 1000));
    await browser.close();
    process.exit(1);
  }

  // Extract jobs using a broad selector for job links
  const jobs = await page.evaluate(() => {
    // Try to select all anchors that look like job listings
    const jobLinks = Array.from(document.querySelectorAll('a.job-listing, a[href*="/careers/job-listings/"]'));

    return jobLinks.map(job => {
      const jobTitle = job.querySelector('h3')?.innerText.trim() || job.innerText.trim() || null;
      const jobLink = job.href || null;

      return {
        job_title: jobTitle,
        job_link: jobLink,
        company: 'epam',
        city: 'Romania',
        country: 'Romania'
      };
    }).filter(job => job.job_title && job.job_link);
  });

  console.log('Extracted jobs:', JSON.stringify(jobs, null, 2));

  await browser.close();
})();
