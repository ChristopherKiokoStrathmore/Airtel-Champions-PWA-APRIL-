// Wrapper entrypoint for deploying the consolidated router
// This imports the server implementation from `src` so the Supabase
// functions deployer can bundle and run it under the expected slug.

// IMPORTANT: Keep the relative path in sync if the project layout changes.
import "../../../src/supabase/functions/server/index.tsx";

// The imported module calls `Deno.serve(...)` itself, so no further code
// is required here.
