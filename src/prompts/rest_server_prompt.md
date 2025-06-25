# Prompt: Generate a Deno REST API Server

You are an expert Deno and TypeScript developer specializing in building robust and scalable REST APIs. Your task is to generate the main entry point and core server setup for a web application based on the provided specifications.

## CONTEXT

### Application High-Level Description
```
{{APP_DESCRIPTION}}
```

### API Routes Specification
```
{{ROUTES_SPEC}}
```

### Data Models Specification
```
{{MODELS_SPEC}}
```

## TASK

Generate the main server file (`src/main.ts`) for a Deno web application.

Follow these requirements precisely:

1.  **Framework**: Use the Deno standard library `Deno.serve` for the server.
2.  **File Structure**: The generated code should assume the following project structure. You are only generating `src/main.ts`. The router, handlers, and db client will be generated in separate steps.

    ```
    .
    ├── src/
    │   ├── main.ts         # (You will generate this) The server entry point.
    │   ├── router.ts       # Wires up routes to handlers.
    │   ├── handlers/       # API request handlers (e.g., user_handlers.ts).
    │   ├── db/             # Database client and model-specific queries.
    │   └── lib/            # Shared utilities.
    ├── .env
    └── deno.jsonc
    ```

3.  **`src/main.ts` Responsibilities**:
    *   **Configuration**: Load configuration (e.g., `PORT`) from environment variables using `std/dotenv`. Default to a sensible port like `8000`.
    *   **Router**: Import the main router function from `./router.ts`. The router should be the final handler for all incoming requests.
    *   **Middleware**:
        *   Implement a logging middleware as a higher-order function that wraps a `Deno.ServeHandler`. It should log the method, path, and response time for each request.
        *   Implement a global error handling middleware, also as a higher-order function. It should catch unhandled errors from the next handler, log them, and return a JSON response with a `500 Internal Server Error` status.
        *   Compose the middleware and the main router together.
    *   **Server Initialization**: Use `Deno.serve` to create and start the HTTP server.
    *   **Graceful Shutdown**: The `Deno.serve` API uses an `AbortSignal` for graceful shutdown. Set up a listener for `SIGINT` to trigger the shutdown.
    *   **Startup Message**: Use the `onListen` callback in `Deno.serve` to log a message to the console indicating that the server is running and on which port.

4.  **Code Style & Best Practices**:
    *   Use modern TypeScript features.
    *   Include JSDoc comments for all functions.
    *   Ensure all imports from Deno standard library use pinned versions for stability (e.g., `https://deno.land/std@0.224.0/dotenv/mod.ts`).
    *   The code must be formatted with `deno fmt`.

## EXAMPLE OUTPUT (for a simple "Todo" app)

This is an example of what the final `src/main.ts` should look like. Use this as a guide for structure and quality.

```typescript
// src/main.ts
import { type ConnInfo, type ServeHandler } from "https://deno.land/std@0.224.0/http/server.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { mainRouter } from "./router.ts";

/**
 * A higher-order function that adds logging to a request handler.
 * @param handler The next handler in the chain.
 * @returns A new handler with logging capabilities.
 */
function loggingMiddleware(handler: ServeHandler): ServeHandler {
  return async (req: Request, info: ConnInfo) => {
    const start = performance.now();
    const resp = await handler(req, info);
    const duration = performance.now() - start;
    console.log(
      `%c${req.method} ${new URL(req.url).pathname} - ${resp.status} (${
        duration.toFixed(2)
      }ms)`,
      "color: blue",
    );
    return resp;
  };
}

/**
 * A higher-order function that adds global error handling to a request handler.
 * @param handler The next handler in the chain.
 * @returns A new handler that catches and handles errors.
 */
function errorHandlingMiddleware(handler: ServeHandler): ServeHandler {
  return async (req: Request, info: ConnInfo) => {
    try {
      return await handler(req, info);
    } catch (err) {
      console.error("Unhandled error:", err);
      return new Response(
        JSON.stringify({ error: "Internal Server Error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  };
}

if (import.meta.main) {
  // Load environment variables from .env file
  await load({ export: true });

  const port = parseInt(Deno.env.get("PORT") ?? "8000", 10);

  // Compose the final handler with middleware
  const handler = errorHandlingMiddleware(loggingMiddleware(mainRouter));

  const controller = new AbortController();
  const { signal } = controller;

  // Graceful shutdown listener
  Deno.addSignalListener("SIGINT", () => {
    console.log("\nReceived SIGINT, shutting down...");
    controller.abort();
  });

  Deno.serve({
    port,
    handler,
    signal,
    onListen({ hostname, port }) {
      console.log(`🚀 Server listening on http://${hostname}:${port}`);
    },
  });
}
```