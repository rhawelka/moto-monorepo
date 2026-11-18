CREATE TABLE "AdminSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "mapCenterLatitude" DOUBLE PRECISION NOT NULL DEFAULT 50.0614,
    "mapCenterLongitude" DOUBLE PRECISION NOT NULL DEFAULT 19.9366,
    "mapZoom" INTEGER NOT NULL DEFAULT 11,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MapZone" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusKm" DOUBLE PRECISION NOT NULL,
    "settingsId" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MapZone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AlertType" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "settingsId" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AlertType_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MapZone_settingsId_idx" ON "MapZone"("settingsId");
CREATE INDEX "AlertType_settingsId_idx" ON "AlertType"("settingsId");

ALTER TABLE "MapZone"
ADD CONSTRAINT "MapZone_settingsId_fkey"
FOREIGN KEY ("settingsId") REFERENCES "AdminSettings"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AlertType"
ADD CONSTRAINT "AlertType_settingsId_fkey"
FOREIGN KEY ("settingsId") REFERENCES "AdminSettings"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
