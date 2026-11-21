# Setting up the KBI Portal (one time, about 40 minutes, no terminal)

The KBI Portal keeps accounts and school records in **Firebase**, Google's free service. The site files are already in this repository (the `portal/` folder) and are published with the rest of the website by GitHub Actions. You do these steps once.

> The portal ships **without** a database. Until you finish these steps, https://kbischool.github.io/portal/ shows "Not connected yet". That is expected.

## Part 1: Create the Firebase project
1. Go to https://console.firebase.google.com and sign in with the school's Google account (use one the school will always control).
2. **Create a project**, name it `kbi-portal`, turn **Google Analytics** off, and finish.

## Part 2: Register the web app
1. On the project home page click the web icon `</>`.
2. App nickname `kbi-portal-web`. Leave **Firebase Hosting** unticked. Click **Register app**.
3. Keep the page with the six values (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`). They are identifiers, not passwords: the security rules protect the data.

## Part 3: Turn on sign-in
1. **Build > Authentication > Get started > Sign-in method.**
2. Enable **Email/Password**. Optionally enable **Google**.
3. **Settings > Authorized domains > Add domain**: add `kbischool.github.io`. When you later move the site to its own domain (for example kbischools.com.ng), add that domain here too.

## Part 4: Create the database
1. **Build > Firestore Database > Create database.** Pick a location near Nigeria (for example `eur3`), which cannot be changed later.
2. Choose **Start in production mode.**

## Part 5: Add the six settings to GitHub
In this repository open **Settings > Secrets and variables > Actions > New repository secret** and add these six, one at a time, without quotes:

| Name | Value |
|---|---|
| `FIREBASE_API_KEY` | `apiKey` |
| `FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `FIREBASE_PROJECT_ID` | `projectId` |
| `FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `FIREBASE_APP_ID` | `appId` |

Then open **Actions > Build and deploy > Run workflow** so the site is rebuilt with them.

## Part 6: Create the owner account
The security rules know the school owner by their Firebase user ID, so do this in order:
1. Open https://kbischool.github.io/portal/ , choose **Create an account** with the owner's email, and verify the email. Do not pick a role yet.
2. In Firebase open **Authentication > Users** and copy your **User UID**.
3. In this repository open `portal/firestore.rules`. Find `function ownerUid()` and replace `REPLACE_WITH_OWNER_UID` with your UID (keep the quotes). Commit the change.
4. Open the file on GitHub, click **Raw**, copy everything, then paste it into **Firestore Database > Rules** in Firebase and click **Publish**. Repeat this step every time `portal/firestore.rules` changes.
5. Reload the portal. The owner lands on the **Schools** page.

## Part 7: Register the school once
1. Create a second account (the school admin's email, for example the principal or bursar) and choose **I am registering the school (first-time setup)**.
2. Fill in the school details. As the owner, open **Schools** and verify KBI Schools.
3. The admin then follows [ADMIN_GUIDE.md](ADMIN_GUIDE.md): classes, subjects, term dates, students and access codes. After the school exists, the registration button disappears, and teachers, parents and students simply pick their role.

## Part 8: Two indexes
Open **Firestore Database > Indexes > Composite > Add index**:
1. Collection `attendance`: `classKey` Ascending, `date` Ascending, scope **Collection**.
2. Collection `audit`: `schoolId` Ascending, `at` Descending, scope **Collection**.

## Part 9: Protect the API key
In https://console.cloud.google.com choose the project, open **APIs & Services > Credentials**, click the **Browser key**, set **Application restrictions** to **Websites**, and add `kbischool.github.io/*` (and your own domain later) and `localhost/*`.

## Roles
| Role | How they get in |
|---|---|
| Owner | Part 6 |
| Admin | Registers the school (Part 7), or is appointed by the owner |
| Teacher | Creates an account, chooses **I am a teacher**, waits for the admin to approve |
| Parent | Creates an account, chooses **I am a parent**, links each child with admission number and code |
| Student | Creates an account, chooses **I am a student**, links their own record. Read-only |

The guides: [Admin](ADMIN_GUIDE.md), [Teacher](TEACHER_GUIDE.md), [Parent](PARENT_GUIDE.md), [Student](STUDENT_GUIDE.md). Student records come in from the Excel upload described in the admin guide (template: [students-template.csv](students-template.csv)).

## Common errors
| You see | Fix |
|---|---|
| "Not connected yet" | The six secrets are missing or misspelled. Fix them and run the deploy again. |
| `auth/unauthorized-domain` | Part 3, step 3. |
| `permission-denied` | Rules not published, wrong owner UID, or you are not approved yet. |
| A screen asks for an index | Part 8. |

## Never share or commit
A Firebase password, a service-account `.json` key, or a `.env` file. The six settings above are not secret, but keep them in GitHub secrets.

## Credit
The portal is built on [Termbook](https://github.com/termbook/termbook.github.io) (MIT licence, see `LICENSE-TERMBOOK`). Fees & Accounts is a separate system for now and is linked from the Portal page.

## KBI only: how the school is created (read this after step F)

This portal serves Knowledge Base International Schools only. Nobody can register another school: the rules let only the owner create the school record, and only the owner create or promote an admin.

1. Sign in with the owner account. The portal shows **Set up the school** (only until the school exists). After that you land in the school as its owner: you can do everything the admin can, plus the **Owner** page (replace the admin, public holidays). Check the name, address and local government, then **Create the school**. This happens once.
2. Teachers, parents and students create an account and join the school; they are never asked to pick a school.
3. To make someone an admin: they register as a teacher, you approve them under **Teachers**, then use **Replace admin** on the school.
4. Redeploy after changing the rules: `firebase deploy --only firestore:rules,firestore:indexes`.

## Classroom features

Admins and teachers see **Assignments**, **Lesson notes**, **Notices** and **Timetable**. Parents and students see them as tabs on the child's page. Everything is text and links (no file uploads), so no paid storage plan is needed. Students hand in work from their own login; the subject teacher scores it and writes feedback.
