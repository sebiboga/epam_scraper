const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.setViewport({ width: 1200, height: 900 });
  await page.goto('https://www.epam.com/careers/job-listings?country=Romania', { waitUntil: 'networkidle2' });

  // Function to click "View More" button if exists
  async function clickViewMore(times = 3) {
    for (let i = 0; i < times; i++) {
      try {
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

  // Wait for job listings container to appear
  await page.waitForSelector('section.job-listings', { timeout: 5000 });

  // Extract jobs
  const jobs = await page.evaluate(() => {
    // Select all job links inside the job listings section
    const jobLinks = Array.from(document.querySelectorAll('section.job-listings a.job-listing'));

    return jobLinks.map(job => {
      const jobTitle = job.querySelector('h3')?.innerText.trim() || null;
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
