ALTER TABLE "User" ADD COLUMN "username" TEXT;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

INSERT INTO "User" (
    "id",
    "username",
    "email",
    "passwordHash",
    "role",
    "createdAt",
    "updatedAt"
)
VALUES (
    '00000000-0000-4000-8000-000000000001',
    'admin',
    'admin@test.pl',
    '$2b$10$lBcbAqxqt/MTSFE8QyJkReqd3iSnI09.ykNLm4FD8/ykd4tYHVRoi',
    'ADMIN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;
