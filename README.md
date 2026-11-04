# MotoMonorepo

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/getting-started/intro#learn-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Run tasks

To run tasks with Nx use:

```sh
npx nx <target> <project-name>
```

For example:

```sh
npx nx build myproject
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

To install a new plugin you can use the `nx add` command. Here's an example of adding the React plugin:

```sh
npx nx add @nx/react
```

Use the plugin's generator to create new projects. For example, to create a new React app or library:

```sh
# Generate an app
npx nx g @nx/react:app demo

# Generate a library
npx nx g @nx/react:lib some-lib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/intro#learn-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:

- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Incident management

The authenticated dashboard includes an incident list with text search, status and
severity filters, sortable columns, pagination, and live updates. The list is
available at `/dashboard/incidents`; `/incidents` redirects to the dashboard
route. Select a row or **Edit** to open `/dashboard/incidents/:id/edit`.
The `/incidents/:id/edit` shortcut redirects to the same editor.

The editor uses Angular Reactive Forms. It validates required, non-whitespace
values and field lengths before submitting changes. The **Change status** action
opens a dynamically created dialog for a quick status update. The interface is
translated into Polish and English.

Create and edit forms use Photon geocoding suggestions based on OpenStreetMap.
Choose a suggestion to save its latitude and longitude with the address; typing
an address without selecting a suggestion does not place the incident on the
map. The map displays located incidents as severity-colored markers and refreshes
when an incident changes. Older incidents without coordinates are reported on
the map page and can be located by editing and selecting an address suggestion.

Administrators also see a **Create incident** action on the list. It opens
`/dashboard/incidents/new`, where an administrator can enter the title,
description, location, status, and severity. Creation is protected by the
dashboard's admin route guard and the API's admin guard. A successful creation
is broadcast as `incident.updated` so other open incident lists refresh.

### Incident API

All REST endpoints require a valid JWT in the `Authorization: Bearer <token>`
header:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/incidents` | Return a filtered, sorted, paginated incident page |
| `GET` | `/api/v1/incidents/:id` | Return one incident |
| `POST` | `/api/v1/incidents` | Create an incident (administrator only) |
| `PATCH` | `/api/v1/incidents/:id` | Validate and save incident changes |

The list endpoint accepts `page`, `pageSize` (maximum 100), `search`, `status`,
`severity`, `sortBy` (`title`, `status`, `severity`, or `reportedAt`), and
`order` (`asc` or `desc`). Search covers the title, description, and location.
The response contains `data`, `total`, `page`, and `pageSize`.

Incident statuses are `OPEN`, `IN_PROGRESS`, `RESOLVED`, and `CLOSED`.
Severities are `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`. Updates validate title
(5–120 characters), description (20–2000 characters), and location (2–160
characters); text values cannot consist only of whitespace.

The Socket.IO namespace is `http://localhost:3000/incidents`. Connect with the
JWT as the Socket.IO `auth.token` value. After a successful REST update, the API
broadcasts the `incident.updated` event with the updated incident to connected
clients. Clients refresh the current page of results when this event arrives.
If live sync disconnects, the dashboard displays its connection status; REST
requests remain available.

### Database and dependencies

The incident model, status/severity enums, and optional coordinates for older
records are defined in `api/prisma/schema.prisma`. Apply pending migrations,
including the incident and coordinate migrations, using the standard local
setup command:

```bash
npx prisma migrate deploy --schema=api/prisma/schema.prisma
```

The incident migration creates the table and enums; the coordinate migration
adds nullable latitude and longitude fields for existing records. Migrations do
not seed sample incidents. Four runtime dependencies were added for live sync:

- `@nestjs/websockets` — NestJS WebSocket gateway decorators and lifecycle.
- `@nestjs/platform-socket.io` — Socket.IO adapter used by the NestJS gateway.
- `socket.io` — WebSocket server and transport used by the API.
- `socket.io-client` — Angular browser client used to connect and receive
  incident update events.

Run the focused incident tests and builds with:

```bash
npx nx test dashboard-web --runInBand
npx nx test api --runInBand
npm run build:api
npm run build:ui
```

## Run locally

Requirements: Node.js 22.22.3 (pinned in `.nvmrc`), npm, and Docker with Docker Compose.

Install dependencies and create the local environment file:

```bash
npm install
cp .env.example .env
```

Start PostgreSQL and check its health:

```bash
docker compose up -d
docker compose ps
```

Apply all Prisma migrations, including creation of the initial admin account:

```bash
npx prisma migrate deploy --schema=api/prisma/schema.prisma
```

Initial admin login:

- Username: `admin`
- Email: `admin@test.pl`
- Password: `admin`

Sign in with email `admin@test.pl`. These are development bootstrap credentials; change the password and credentials before exposing the application outside a trusted environment.

Start the API in one terminal:

```bash
npm run start:api
```

The API is available at `http://localhost:3000/api/v1`.

Start the dashboard in another terminal:

```bash
npm run start:ui
```

The dashboard is available at `http://localhost:4200`.

To stop PostgreSQL while keeping its data:

```bash
docker compose down
```

Use `docker compose down -v` only when you want to delete the database data.

## Tests and builds

```bash
npx nx test api --runInBand
npm run build:api
npm run build:ui
```
