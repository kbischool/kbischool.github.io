# Deployment guide

You never run a command. GitHub builds and publishes the site for you.

## How it works

When a change reaches the `main` branch, the **Build and deploy** workflow runs on GitHub: it builds the pages, checks them for broken links and a valid manifest and service worker, and publishes to GitHub Pages. A pull request runs the same checks but does **not** publish.

## One-time check

1. Open the repository on github.com and click **Settings**.
2. Click **Pages** in the left menu.
3. Under **Build and deployment**, **Source** must say **GitHub Actions**. If it says "Deploy from a branch", change it.

The repository must be **public** for Pages on the free plan.

## Review the redesign before it goes live

1. Click **Pull requests** and open **Rebuild: premium redesign**.
2. Click **Checks**. A green tick means the build and checks passed. A yellow dot means it is still running.
3. To look at the finished site: click the **Pull request check** run, scroll to **Artifacts**, download **built-site**, unzip it, then open `index.html`. Pages open best from the live site, so the quickest check is to merge and look, and roll back if you do not like it.
4. Happy? Click **Merge pull request**, then **Confirm merge**.

GitHub Pages has no built-in preview for pull requests. Your two options are the downloaded artifact above, or merge and rely on the easy rollback below.

## What you should see after merging

1. Click **Actions**. The top run is **Build and deploy**. A green tick means the site is live. Click the **deploy** job to see the live link.
2. Open https://kbischool.github.io/ and press **Ctrl + F5** once so your browser forgets the old design.

If you see a red cross, click the run, then the step with the cross, and read the message. Lighthouse reports never fail a deployment.

## Change text, dates or staff names later

Each page is one file in `src/pages/` (for example `news.html`).

1. On github.com, open `src/pages/news.html` and click the **pencil** icon.
2. Edit the words between the tags. Leave the `<` and `>` parts alone.
3. Click **Commit changes**, choose **Create a new branch and start a pull request** to review first, or commit straight to `main` to publish.

With GitHub Desktop: click **Fetch origin**, edit the file in any text editor, then in GitHub Desktop type a short summary, click **Commit to main**, then **Push origin**.

## Roll back

1. Click **Pull requests**, then **Closed**, and open the merged pull request.
2. Click **Revert**. GitHub opens a new pull request that undoes it.
3. Click **Create pull request**, then **Merge pull request**. The old version is published again in about a minute.

## The enquiry forms

Both forms send through FormSubmit to knowledgebaseschools@gmail.com (copy to techbasengr@gmail.com). Because the form now returns visitors to this site instead of kbischools.com.ng, FormSubmit may ask for a **one-time confirmation** the first time a message arrives. Open the email from FormSubmit and click the confirmation button. Until you do, messages may not be delivered. Send a test message after merging.

## Connect a custom domain

1. **Settings > Pages > Custom domain**: type the domain (for example `kbischools.com.ng`) and click **Save**.
2. At your domain registrar, add the DNS records that GitHub lists on that page.
3. Create a file named `CNAME` in `src/public/` containing only the domain, so every address in the site (canonical links, sitemap, install manifest) switches to it automatically.
4. When GitHub shows the **Enforce HTTPS** box, tick it.

## Turn on security scanning

**Settings > Code security**: enable **Dependabot alerts**, **Secret scanning** and **Push protection**. CodeQL already runs weekly and on every change.
