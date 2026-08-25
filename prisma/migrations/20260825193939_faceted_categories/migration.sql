-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Jewelry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'Item',
    "type" TEXT NOT NULL,
    "material" TEXT,
    "gemstone" TEXT,
    "length" TEXT,
    "condition" TEXT DEFAULT 'New',
    "cost" REAL NOT NULL,
    "retail" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Jewelry" ("cost", "createdAt", "gemstone", "id", "material", "name", "quantity", "retail", "type", "updatedAt") SELECT "cost", "createdAt", "gemstone", "id", "material", "name", "quantity", "retail", "type", "updatedAt" FROM "Jewelry";
DROP TABLE "Jewelry";
ALTER TABLE "new_Jewelry" RENAME TO "Jewelry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
