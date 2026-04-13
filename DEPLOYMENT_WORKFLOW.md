# Airtel Champions PWA: Git & Vercel Deployment Workflow

This document outlines the complete, step-by-step process for pushing code to GitHub and deploying to Vercel, including all commands and troubleshooting steps that worked for this project.

---

## 1. Set Up Git Branching

- **main**: Production branch (deployed by Vercel)
- **develop**: Development branch (for new features and testing)

### Create and Switch Branches
```
git checkout -b develop   # Create develop branch if it doesn't exist
git checkout main         # Switch to main branch
git checkout develop      # Switch back to develop for work
```

---

## 2. Make and Stage Changes

- Work on your code in the `develop` branch.
- Stage all changes:
```
git add .
```

- Commit your changes:
```
git commit -m "<your message>"
```

---

## 3. Push to GitHub

- Push develop branch:
```
git push origin develop
```

---

## 4. Merge Develop into Main for Production

- Switch to main:
```
git checkout main
```
- Merge develop into main:
```
git merge develop
```
- Push main to GitHub:
```
git push origin main
```

---

## 5. Vercel Deployment

- Vercel auto-deploys the `main` branch.
- Check your Vercel dashboard for deployment status.
- If you don’t see changes, try a hard refresh (Ctrl+F5) or clear browser cache.

---

## 6. Troubleshooting: Commit Author & Vercel Hobby Plan

If you see this error:
> The deployment was blocked because the commit author did not have contributing access to the project on Vercel. The Hobby Plan does not support collaboration for private repositories.

**Solution:**
1. Set your Git user to match the Vercel project owner:
   ```
   git config user.name "<vercel-owner-name>"
   git config user.email "<vercel-owner-email>"
   ```
2. Amend your last commit to update the author:
   ```
   git commit --amend --reset-author
   git push origin main --force
   ```

---

## 7. Vim/Swap File Issues During Commit

If you see a Vim swap file warning (E325: ATTENTION):
- Press `D` to delete the swap file and continue.
- Or press `E` to edit anyway.
- Save and exit with `:wq`.

---

## 8. Useful Git Commands

- See current branch:
  ```
  git branch
  ```
- See status:
  ```
  git status
  ```
- See commit log:
  ```
  git log --oneline --graph --all
  ```
- Force push (use with caution):
  ```
  git push origin main --force
  ```

---

## 9. General Workflow Summary

1. Work on `develop` branch, commit and push changes.
2. Merge `develop` into `main` when ready for production.
3. Push `main` to GitHub.
4. Vercel auto-deploys from `main`.
5. If Vercel blocks deployment, fix commit author and force push.
6. For Vim swap file issues, delete or edit anyway, then save and exit.

---

**Keep this document updated with any new commands or fixes that work for your team!**
