**System Role:** Lead DevOps & Full-Stack Architect
**Task:** Resolve Git merge conflicts by overwriting UI files with incoming changes, then patching them for the new architecture.

**Context:**
I am in the middle of a Git merge with conflicts. 
- **Incoming Changes (`origin/master`):** Contains the final, correct UI/UX components and styling.
- **Current Changes (`HEAD`):** Contains my new 2-tier architecture (FastAPI serving static React files, no Vite proxy).

**Execution Directives:**
1. **Force Accept UI:** For all React components, CSS files, and frontend layout files (`.jsx`, `.js`, `.css`, `.tsx`), completely overwrite the current files with the **Incoming Changes**. We want the new UI exactly as it was designed.
2. **Patch Network Paths:** After accepting the incoming UI files, scan them for any API calls (e.g., `fetch()`, `axios`). You MUST change all absolute backend URLs or Vite proxy endpoints to relative paths (e.g., `/api/simulate`). This is non-negotiable because the frontend is now served directly from the FastAPI backend on port 8080.
3. **Preserve Docker & Backend:** For `Dockerfile`, `docker-compose.yml`, and `main.py`, preserve the 2-tier consolidated architecture (Current Changes). Do not let the incoming branch reintroduce the Vite frontend container or the `CORSMiddleware`.

Please process the conflicted files, resolve the markers, and output the clean codebase.