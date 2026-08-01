# Empirical Command Verification Evidence

## 1. System & Git Verification

```bash
$ pwd
C:/Users/Michael/Documents/Marketplace-Loning

$ node --version
v26.4.0

$ npm --version
11.18.0

$ git --version
git version 2.55.0.windows.3

$ git rev-parse HEAD
64de9755a07dc4b35699df8f34b40824b2b4c0dc

$ git rev-parse origin/master
64de9755a07dc4b35699df8f34b40824b2b4c0dc
```

---

## 2. Code Quality & Test Evidence

```bash
$ npm run typecheck
> loning-maju-frontend@1.0.0 typecheck
> tsc --noEmit
> loning-maju-backend@1.0.0 typecheck
> tsc --noEmit -p tsconfig.json
Exit Code: 0 (Success)

$ npm run test
> loning-maju-frontend@1.0.0 test
> vitest run
 Test Files  21 passed (21)
      Tests  126 passed (126)

> loning-maju-backend@1.0.0 test
> vitest run
 Test Files  17 passed (17)
      Tests  181 passed (181)
Exit Code: 0 (Success)

$ npm run build:all
> loning-maju-frontend@1.0.0 build
> vite build
dist/index.html 1.35 kB
✓ built in 2.65s

> loning-maju-backend@1.0.0 build
> tsc -p tsconfig.json
Exit Code: 0 (Success)
```
