const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Set realistic user agent and headers
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  );
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });

  await page.setViewport({ width: 1200, height: 900 });

  console.log('Navigating to EPAM Romania jobs page...');
  await page.goto('https://www.epam.com/careers/job-listings?country=Romania', {
    waitUntil: 'networkidle2',
  });

  // Wait extra time for Cloudflare challenge to pass
  await page.waitForTimeout(7000);

  // Optional: Click "View More" buttons up to 3 times to load more jobs
  async function clickViewMore(times = 3) {
    for (let i = 0; i < times; i++) {
      try {
        await page.waitForSelector('section > a.button--primary', { timeout: 3000 });
        const button = await page.$('section > a.button--primary');
        if (!button) {
          console.log('No more "View More" button found.');
          break;
        }
        console.log('Clicking "View More" button...');
        await button.click();
        await page.waitForTimeout(3000);
      } catch {
        console.log('No "View More" button found or timeout reached.');
        break;
      }
    }
  }

  await clickViewMore();

  // Wait for job listings container
  try {
    await page.waitForSelector('section.job-listings', { timeout: 5000 });
  } catch {
    console.warn('Job listings container not found, trying alternative selector...');
    // Try alternative selector or proceed anyway
  }

  // Extract job data
  const jobs = await page.evaluate(() => {
    // Select job links by class or URL pattern
    const jobLinks = Array.from(
      document.querySelectorAll('a.job-listing, a[href*="/careers/job-listings/"]')
    );

    return jobLinks
      .map((job) => {
        const jobTitle = job.querySelector('h3')?.innerText.trim() || job.innerText.trim() || null;
        const jobLink = job.href || null;
        return {
          job_title: jobTitle,
          job_link: jobLink,
          company: 'epam',
          city: 'Romania',
          country: 'Romania',
        };
      })
      .filter((job) => job.job_title && job.job_link);
  });

  console.log('Extracted jobs:', JSON.stringify(jobs, null, 2));

  await browser.close();
})();
