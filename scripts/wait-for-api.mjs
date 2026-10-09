const healthUrl = 'http://127.0.0.1:3000/health';
const deadline = Date.now() + 15_000;

while (Date.now() < deadline) {
  try {
    const response = await fetch(healthUrl, {
      signal: AbortSignal.timeout(1000),
    });
    if (response.ok) {
      console.log('API is ready. Starting the web app.');
      process.exit(0);
    }
  } catch {
    // The API is still connecting to MongoDB or has not started listening yet.
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}

console.error(
  '\nAPI did not become healthy within 15 seconds. The web app was not started. Check the [api] error above.\n',
);
process.exit(1);
