# Deployment guide

No terminal or software installation is needed. Everything is done on github.com.

## How it works

When a change is merged into the `main` branch, GitHub automatically checks the site and publishes it. A pull request (a proposed change) is checked but **not** published until you merge it.

## One-time setup

1. Open the repository on GitHub and click **Settings**.
2. In the left menu click **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.

You should see the page say the site is published from GitHub Actions.

## Review and merge the redesign

1. Click **Pull requests** and open **Rebrand: premium redesign**.
2. Click the **Checks** tab. A green tick means the site assembled correctly. Lighthouse reports appear in the run's **Artifacts**.
3. Click **Files changed** to read what changed. To see the pages themselves, download the `github-pages` artifact from the run summary and open `index.html` after unzipping it.
4. Happy with it? Click **Merge pull request**, then **Confirm merge**. To discard it instead, click **Close pull request**; the live site is unchanged either way.

## Update content

1. Open the file (for example `about.html`) and click the pencil icon.
2. Edit the text, then click **Commit changes**. Choose **Create a new branch and start a pull request** to review first, or commit directly to `main` to publish.

## Check that a deployment worked

Click the **Actions** tab. Your latest run shows a **green tick** (success), a **yellow dot** (running) or a **red cross** (failed). Click a red run, then the step with the cross, to read the error. Link and Lighthouse warnings never fail a deployment.

## Roll back

Open **Pull requests > Closed**, open the merged pull request and click **Revert**. GitHub creates a new pull request that undoes it; merge that to restore the previous version.

## Custom domain

Settings > Pages > **Custom domain**: enter the domain (for example `kbischools.com.ng`) and save. At your domain registrar, add the DNS records GitHub lists on that page, then tick **Enforce HTTPS** once it appears. If you move the site to that domain, also update the `_next` hidden field in `contact.html` and `admission.html`, and the URLs in `sitemap.xml`, `robots.txt` and each page's `canonical` and `og:url` tags.

## Turn on secret scanning

Settings > **Code security** > enable **Secret scanning** and **Push protection**. CodeQL scanning already runs from the **Security** tab.
