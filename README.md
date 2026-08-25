# Karl's Jewelry — Inventory

A small inventory app: one table of everything in stock, and a button to add a new item.

Built with SvelteKit + Prisma, backed by a SQLite file (`prisma/jewelry.db`).

## Requirements

Node 22 LTS or newer.

## Setup

```sh
npm install
npx prisma migrate dev
```

That creates `prisma/jewelry.db` and generates the Prisma client.

## Running it

```sh
npm run dev
```

Then open http://localhost:5173.

## Using it

- **Add** — the "+ Add item" button, top right.
- **Edit** — click an item's name, or its Edit button.
- **Sell one** — hover a row and hit the `−` next to the quantity. Quantity stops
  at zero and turns red when a piece is out of stock.
- **Search** — filters on name, type, material, and gemstone as you type. The
  totals row narrows to match what's showing.
- **Sort** — click any column heading; click again to reverse.

## Backing up

The entire inventory is the single file `prisma/jewelry.db`.

`Start Inventory.bat` snapshots it into `backups/` every time the app starts,
keeping the 10 most recent copies. Because the project lives in OneDrive, those
snapshots sync off this machine on their own.

To take one by hand: `npm run backup`

To restore, copy a file out of `backups/` over `prisma/jewelry.db` while the app
is closed, and rename it to `jewelry.db`.

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app |
| `npm run backup` | Snapshot the database into `backups/` |
| `npm run db:migrate` | Apply schema changes to the database |
| `npm run db:studio` | Browse/edit the data in a web UI |
| `npm run build` | Build for production |

## Categories

The old program stored one long category string per item ("Ring gold diamond
engagement"), which forced a new category for every combination — it had grown
to roughly 90, with typos and duplicates. Each fact now gets its own field:

| Field | Holds |
| --- | --- |
| `kind` | Item (stock) or Service (repairs, appraisals, deposits) |
| `type` | Ring, Chain, Bracelet, Earrings, Giftware… |
| `material` | Metal and karat, or leather |
| `gemstone` | Diamond, Ruby, Sapphire… |
| `length` | Chains and necklaces only |
| `condition` | New, Estate, Fine Estate, Private Estate, Costume |

**To add a new option** — a metal, a stone, a type — add one line to
[`src/lib/vocab.ts`](src/lib/vocab.ts). The form dropdowns and the filter bar
both read from it, so that single edit is all it takes.

Services are excluded from inventory totals, since a repair isn't stock sitting
on a shelf.

## Editing the columns

The columns live in [`prisma/schema.prisma`](prisma/schema.prisma). Change the
`Jewelry` model there, then run `npm run db:migrate` to update the database.
