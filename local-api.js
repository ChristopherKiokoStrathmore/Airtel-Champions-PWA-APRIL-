const http = require('http');
const url = require('url');

const uploadedBatches = new Map();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function sendJson(res, data, status = 200) {
  res.writeHead(status, { ...corsHeaders, "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (pathname === "/make-server-28f2f653/health") {
    return sendJson(res, {
      status: "ok",
      environment: "local_dev",
      version: "3.5.0-dev",
      timestamp: new Date().toISOString(),
    });
  }

  if (pathname === "/make-server-28f2f653/upload-excel" && req.method === "POST") {
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

    return sendJson(res, {
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
    });
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
    let body = "";
    req.on("data", (chunk) => { body += chunk.toString(); });
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
        sendJson(res, { error: "Go-live failed" }, 500);
      }
    });
    return;
  }

  if (pathname === "/make-server-28f2f653/announcements" && req.method === "GET") {
    return sendJson(res, {
      success: true,
      announcements: [
        {
          id: "1",
          title: "Server Ready",
          message: "Local development server is running",
        },
      ],
    });
  }

  return sendJson(res, { error: "Endpoint not found" }, 404);
});

server.listen(3001, "localhost", () => {
  console.log('\n🚀 Local Dev Server running at http://localhost:3001');
  console.log('📝 Endpoints:');
  console.log('  - GET  /make-server-28f2f653/health');
  console.log('  - POST /make-server-28f2f653/upload-excel');
  console.log('  - GET  /make-server-28f2f653/upload-history');
  console.log('  - POST /make-server-28f2f653/go-live');
  console.log('  - GET  /make-server-28f2f653/announcements');
  console.log('\n💡 UI at http://localhost:3000 will POST to these endpoints\n');
});
