// Local Development Server for testing upload endpoints
// Runs on http://localhost:3001 as a mock backend
// Use: node local-dev-server.js

const http = require('http');
const url = require('url');

interface UploadedBatch {
  id: string;
  filename: string;
  uploaded_at: string;
  status: "staged" | "previewed" | "live";
  row_count: number;
}

const uploadedBatches: Map<string, UploadedBatch> = new Map();

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function sendJson(res: any, data: any, status: number = 200) {
  res.writeHead(status, { ...corsHeaders, "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function handleRequest(req: any, res: any) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  // OPTIONS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // Health check
  if (pathname === "/make-server-28f2f653/health") {
    return sendJson(res, {
      status: "ok",
      environment: "local_dev",
      version: "3.5.0-dev",
      timestamp: new Date().toISOString(),
    });
  }

  // Upload endpoints
  if (pathname === "/make-server-28f2f653/upload-excel" && req.method === "POST") {
    return handleUploadExcel(req, res);
  }

  if (pathname === "/make-server-28f2f653/upload-history" && req.method === "GET") {
    const batches = Array.from(uploadedBatches.values());
    return sendJson(res, {
      success: true,
      batches,
      total_count: batches.length,
    });
  }

  if (pathname === "/make-server-28f2f653/go-live" && req.method === "POST") {
    return handleGoLive(req, res);
  }

  if (pathname === "/make-server-28f2f653/announcements" && req.method === "GET") {
    return sendJson(res, {
      success: true,
      announcements: [
        {
          id: "1",
          title: "Server Ready",
          message: "Local development server is running",
          type: "info",
          created_at: new Date().toISOString(),
        },
      ],
    });
  }

  // 404
  return sendJson(res, { error: "Endpoint not found", path: pathname }, 404);
}

function handleUploadExcel(req: any, res: any) {
  let body = "";
  req.on("data", (chunk: any) => { body += chunk.toString(); });
  req.on("end", () => {
    try {
      const batchId = Date.now().toString();
      const filename = "sales_force_contacts.csv";
      const rowCount = 150;

      uploadedBatches.set(batchId, {
        id: batchId,
        filename,
        uploaded_at: new Date().toISOString(),
        status: "staged",
        row_count: rowCount,
      });

      console.log(`📤 Uploaded: ${filename} (${rowCount} rows)`);

      sendJson(res, {
        success: true,
        batch_id: batchId,
        message: "File staged successfully",
        summary: {
          total_rows: rowCount,
          new_users: 45,
          removed_users: 15,
          role_changes: 22,
          zone_transfers: 30,
          unchanged: 38,
        },
        preview: {
          new_users: [
            {
              type: "new_user",
              phone_number: "0785638463",
              full_name: "John Doe",
              role: "se",
              zone: "Nairobi",
            },
          ],
          removed_users: [
            {
              type: "removed_user",
              phone_number: "0700000001",
              full_name: "Old User",
            },
          ],
          role_changes: [],
          zone_transfers: [],
        },
      });
    } catch (error) {
      sendJson(res, { error: "Upload failed", details: String(error) }, 500);
    }
  });
}

function handleGoLive(req: any, res: any) {
  let body = "";
  req.on("data", (chunk: any) => { body += chunk.toString(); });
  req.on("end", () => {
    try {
      const { batch_id } = JSON.parse(body);

      if (!batch_id) {
        return sendJson(res, { error: "batch_id required" }, 400);
      }

      const batch = uploadedBatches.get(batch_id);
      if (!batch) {
        return sendJson(res, { error: "Batch not found" }, 404);
      }

      batch.status = "live";
      console.log(`✅ Batch ${batch_id} is now LIVE`);

      sendJson(res, {
        success: true,
        message: "Changes applied to production database",
        batch_id,
        changes_applied: batch.row_count,
      });
    } catch (error) {
      sendJson(res, { error: "Go-live failed", details: String(error) }, 500);
    }
  });
}

const port = 3001;
const server = http.createServer(handleRequest);
server.listen(port, "localhost", () => {
  console.log(`🚀 Local Dev Server running at http://localhost:${port}`);
  console.log(`📝 Endpoints available:`);
  console.log(`  - GET  /make-server-28f2f653/health`);
  console.log(`  - POST /make-server-28f2f653/upload-excel`);
  console.log(`  - GET  /make-server-28f2f653/upload-history`);
  console.log(`  - POST /make-server-28f2f653/go-live`);
  console.log(`  - GET  /make-server-28f2f653/announcements`);
  console.log(`\n💡 UI at http://localhost:3000 will call this server`);
});

