This is rust code managed by tauri, used to build the native app.

It is largely managed by the tauri cli, installed by npm.

Notable commands:

```npx tauri dev```
Run vite + render the page in a native window.
When it runs the first time it compiles a lot of rust code,
and might complain about missing system dependencies

```npx tauri add <...>```
Adds a tauri 'plugin' (eg fs), handles package.json, cargo.toml, and other places.

Most important file: tauri.conf.json
