# Starting The Stack

Use the repo root command below to launch Suppa locally:

```sh
cd /Users/jonsearle/Desktop/Suppa
npm run dev
```

What it does:

- opens Terminal windows for PocketBase, backend, and frontend,
- skips any service that is already listening on its expected port,
- starts the backend with the local Express server on `http://localhost:8888`,
- starts the frontend on `http://localhost:3000`.

Ports used:

- `8090` for PocketBase
- `8888` for the backend
- `3000` for the frontend

To stop the local stack from the repo root:

```sh
npm run dev:stop
```

Notes:

- The launcher currently targets `.claude/worktrees/iteration-1`.
- If you move to a different active worktree later, update the `WORKTREE_ROOT` value in [start-suppa-dev.sh](/Users/jonsearle/Desktop/Suppa/scripts/start-suppa-dev.sh).
