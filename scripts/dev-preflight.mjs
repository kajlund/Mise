import net from 'node:net';

const requiredPorts = [3000, 5173];
const loopbackHosts = ['127.0.0.1', '::1'];

function checkPort(host, port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        reject(
          new Error(
            `Port ${port} is already in use on ${host}. Stop the previous Mise dev task and run npm run dev again.`,
          ),
        );
        return;
      }
      reject(error);
    });
    server.listen({ host, port, ipv6Only: host === '::1' }, () =>
      server.close(resolve),
    );
  });
}

try {
  await Promise.all(
    requiredPorts.flatMap((port) =>
      loopbackHosts.map((host) => checkPort(host, port)),
    ),
  );
  console.log('Development ports 3000 and 5173 are available.');
} catch (error) {
  console.error(
    `\nDevelopment startup blocked: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}
