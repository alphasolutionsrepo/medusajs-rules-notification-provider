# MedusaJS Rules Notification Provider

A MedusaJS notification provider that forwards notifications based on rules. In development, it can override the recipient based on a regex pattern.

## Installation

Using **npm**:

```bash
npm install medusajs-rules-notification-provider
```

Using **yarn**:

```bash
yarn add medusajs-rules-notification-provider
```

## Usage

Configure the provider in your MedusaJS project as follows:

```typescript
modules: {
  [Modules.NOTIFICATION]: {
    resolve: "@medusajs/medusa/notification",
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/notification-local",
          id: "local",
          options: {
            channels: ["feed"],
          },
        },
        {
          resolve: "@medusajs/medusa/notification-sendgrid",
          id: "sendgrid",
          options: {
            channels: ["email"],
            api_key: process.env.SENDGRID_API_KEY,
            from: process.env.SENDGRID_FROM,
          },
        },
        {
          resolve: "medusajs-rules-notification-provider",
          id: "rules-notification",
          options: {
            channels: ["rules"],
            forwardChannel: "email",
            env: "development",
            toMatchPattern: "^[A-Z]+@example\\.com$",
            overrideToOnMatch: "dev-match@example.com",
            overrideToOnMismatch: "dev-nomatch@example.com"
          }
        }
      ]
    }
  }
}
```

## Options

The provider supports the following configuration options:

- **forwardChannel** (string, required):  
  The channel to which notifications will be forwarded.

- **env** (string, optional):  
  The runtime environment (e.g., "development" or "production"). If not provided, it falls back to `process.env.NODE_ENV`.

- **toMatchPattern** (string, optional):  
  A regex pattern to test the `notification.to` value in development mode.

- **overrideToOnMatch** (string, optional):  
  The override value for `notification.to` if it matches the regex pattern.

- **overrideToOnMismatch** (string, optional):  
  The override value for `notification.to` if it does not match the regex pattern.

## License

MIT License
