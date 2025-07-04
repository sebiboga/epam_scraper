const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set viewport and timeout
  await page.setViewport({ width: 1200, height: 800 });
  page.setDefaultTimeout(10000);

  // Go to EPAM Romania job listings
  await page.goto('https://www.epam.com/careers/job-listings?country=Romania', { waitUntil: 'networkidle2' });

  // Function to click "View More" buttons until none left or max tries
  async function clickViewMore(maxClicks = 5) {
    for (let i = 0; i < maxClicks; i++) {
      try {
        // Wait for "View More" button
        const viewMoreSelector = 'section > a:contains("View More"), a[aria-label="View More"]';

        // Using XPath for "View More" button text
        const [button] = await page.$x("//a[contains(text(), 'View More')]");
        if (!button) break;

        await button.click();
        // Wait for new jobs to load
        await page.waitForTimeout(2000);
      } catch (e) {
        // No more buttons or error, break loop
        break;
      }
    }
  }

  // Click "View More" buttons to load all jobs
  await clickViewMore();

  // Extract job listings
  const jobs = await page.evaluate(() => {
    // Select all job listing elements
    const jobNodes = document.querySelectorAll('section.job-listing > a, section > a.job-listing');

    const results = [];
    jobNodes.forEach(job => {
      const jobTitle = job.querySelector('h3')?.innerText.trim() || null;
      const jobLink = job.href || null;

      // Since we are on Romania page, city and country are Romania
      const city = 'Romania';
      const country = 'Romania';

      if (jobTitle && jobLink) {
        results.push({
          job_title: jobTitle,
          job_link: jobLink,
          company: 'epam',
          city,
          country
        });
      }
    });

    return results;
  });

  console.log(JSON.stringify(jobs, null, 2));

  await browser.close();
})();
